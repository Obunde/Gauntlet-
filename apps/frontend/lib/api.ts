import runMock from "@/mocks/run_mock.json";
import type { RegressResponse, RunStarted, RunStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const mockRun = runMock as RunStatus;
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
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
