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
  attack_type: "prompt_injection" | "unauthorized_tool_action" | string;
  prompt: string;
  target_response: string;
  tool_calls: string[];
  judge: JudgeVerdict;
  trace_id: string;
}

export interface RegressionTest {
  test_id: string;
  source_attack_id: string;
  language: string;
  code: string;
  assertion: string;
}

export interface RegressionResult {
  test_id: string;
  passed: boolean;
}

export interface RegressResponse {
  results: RegressionResult[];
  gate: "RED" | "GREEN";
}

export interface RunStatus {
  run_id: string;
  policy_id: string;
  target_url: string;
  status: "pending" | "running" | "done" | "error";
  gate: "RED" | "GREEN" | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  attacks: AttackRecord[];
  regression_tests: RegressionTest[];
  regression_runs?: RegressResponse[];
}

export interface RunStarted {
  run_id: string;
}

export interface GuardRequest {
  hardened: boolean;
}

export interface GuardResponse {
  hardened: boolean;
  message: string;
}
