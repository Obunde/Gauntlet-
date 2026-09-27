import runMock from "@/mocks/run_mock.json";
import type { BrevTelemetryResponse, RegressResponse, RunStarted, RunStatus } from "./types";

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
  if (USE_MOCKS) return delay().then(() => ["customer_support"]);
  return request<string[]>("/api/policies");
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

export async function setTargetGuard(hardened: boolean): Promise<{ hardened: boolean; message: string }> {
  if (USE_MOCKS) {
    await delay(300);
    return { hardened, message: hardened ? "Target agent is now HARDENED (Guard ACTIVE)" : "Target agent is VULNERABLE (Guard OFF)" };
  }
  return request<{ hardened: boolean; message: string }>("/api/target/guard", {
    method: "POST",
    body: JSON.stringify({ hardened }),
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


