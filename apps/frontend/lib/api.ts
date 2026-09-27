import runMock from "@/mocks/run_mock.json";
import type {
  BrevTelemetryResponse,
  GuardResponse,
  HealthResponse,
  IssueReport,
  RegressResponse,
  RunStarted,
  RunStatus,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
// Frontend work must remain usable while the backend is being integrated.
// Opt into live requests explicitly with NEXT_PUBLIC_USE_MOCKS=false.
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

const mockRun = runMock as RunStatus;
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err: any) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(`Cannot reach Backend API at ${API_URL}. Ensure 'brev port-forward' is running or check network connection.`);
    }
    throw err;
  }
}

export async function getPolicies(): Promise<string[]> {
  if (USE_MOCKS) return delay().then(() => ["customer_support", "financial_agent"]);
  return request<string[]>("/api/policies");
}

export async function getHealth(): Promise<HealthResponse> {
  if (USE_MOCKS) return delay(180).then(() => ({ ok: true, mode: "mock", pipeline_ready: true }));
  return request<HealthResponse>("/api/health");
}

export async function startRun(policy_id: string, target_url?: string): Promise<RunStarted> {
  if (USE_MOCKS) return delay().then(() => ({ run_id: mockRun.run_id }));
  return request<RunStarted>("/api/run", {
    method: "POST",
    body: JSON.stringify({ policy_id, target_url }),
  });
}

/** `replay` serves the recorded run instead of calling the backend. */
export async function getRun(runId: string, replay = false): Promise<RunStatus> {
  if (USE_MOCKS || replay) return delay().then(() => mockRun);
  return request<RunStatus>(`/api/run/${runId}`);
}

export function buildIssueReport(run: RunStatus, runId?: string): IssueReport {
  const breached = run.attacks.filter((attack) => attack.judge.succeeded);
  return {
    run_id: runId ?? run.run_id,
    total_attacks: run.attacks.length,
    total_failures: breached.length,
    groups: breached.map((attack, index) => ({
      issue_id: `issue-${index + 1}`,
      violated_tool: attack.tool_calls[0] ?? (attack.judge.violated_rule ?? "unknown"),
      attack_type: attack.attack_type,
      severity: attack.attack_type === "unauthorized_tool_action" ? "critical" : "high",
      occurrences: 1,
      max_confidence: attack.judge.confidence,
      score: Math.round(attack.judge.confidence * 100),
      attack_ids: [attack.attack_id],
      trace_ids: [attack.trace_id],
      example_prompt: attack.prompt,
      regression_test_ids: run.regression_tests
        .filter((test) => test.source_attack_id === attack.attack_id)
        .map((test) => test.test_id),
      fixed: false,
    })),
  };
}

export async function getIssues(runId: string, replay = false, run?: RunStatus): Promise<IssueReport> {
  if (run) return buildIssueReport(run, runId);
  if (USE_MOCKS || replay) {
    return delay(220).then(() => buildIssueReport(mockRun, runId));
  }
  try {
    return await request<IssueReport>(`/api/run/${runId}/issues`);
  } catch {
    const liveRun = await getRun(runId);
    return buildIssueReport(liveRun, runId);
  }
}

export async function regress(runId: string): Promise<RegressResponse> {
  if (USE_MOCKS) {
    await delay(800);
    return {
      results: mockRun.regression_tests.map((t) => ({ test_id: t.test_id, passed: true })),
      gate: "GREEN",
    };
  }
  return request<RegressResponse>(`/api/run/${runId}/regress`, { method: "POST" });
}

export async function setTargetGuard(enabled: boolean): Promise<GuardResponse> {
  if (USE_MOCKS) {
    await delay(300);
    return { enabled };
  }
  return request<GuardResponse>("/api/target/guard", {
    method: "POST",
    body: JSON.stringify({ enabled }),
  });
}

export async function getBrevTelemetry(): Promise<BrevTelemetryResponse> {
  if (USE_MOCKS) {
    return {
      instance_name: "mechanical-chocolate-wolf",
      gpu_spec: "NVIDIA L40S 48GB Tensor Core GPU",
      provider: "NVIDIA Brev Cloud",
      base_url: "http://localhost:11435/v1",
      active_model: "nvidia/llama-3.1-nemotron-70b-instruct",
      total_invocations: 42,
      total_prompt_tokens: 12850,
      total_completion_tokens: 3410,
      total_tokens: 16260,
      avg_tokens_per_request: 387.1,
      throughput_est_tokens_sec: 142.5,
      latency_avg_ms: 320,
      speedup_vs_cloud_api: "14.2x",
      purpose_breakdown: { attacker_generation: 9800, judge_evaluation: 6460 }
    };
  }
  return request<BrevTelemetryResponse>("/api/brev/telemetry");
}
