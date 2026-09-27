// Hand-written to mirror apps/backend/gauntlet/shared/schemas.py.
// `make types` OVERWRITES this file from http://localhost:8000/openapi.json.
// TODO(FE1): once generated, re-export these names from the generated
//            `components["schemas"]` so imports elsewhere keep working.

export type AttackType = "prompt_injection" | "unauthorized_tool_action";
export type Gate = "RED" | "GREEN";
export type Status = "pending" | "running" | "done" | "error";

export interface JudgeVerdict {
  succeeded: boolean;
  confidence: number;
  reasoning: string;
  violated_rule: string | null;
}

export interface AttackRecord {
  attack_id: string;
  run_id: string;
  timestamp: string;
  attack_type: AttackType;
  prompt: string;
  target_response: string;
  tool_calls: string[];
  judge: JudgeVerdict;
  trace_id: string;
}

export interface RegressionTest {
  test_id: string;
  source_attack_id: string;
  language: "python";
  code: string;
  assertion: string;
}

export interface RunStatus {
  run_id: string;
  status: Status;
  gate: Gate | null;
  attacks: AttackRecord[];
  regression_tests: RegressionTest[];
}

export interface RunStarted {
  run_id: string;
}

export interface RegressResponse {
  results: { test_id: string; passed: boolean }[];
  gate: Gate;
}
