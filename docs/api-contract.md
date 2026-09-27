# Gauntlet API contract

Base URL: `http://localhost:8000`. The live source of truth is `/openapi.json`
(`make types` regenerates `apps/frontend/lib/types.ts` from it). Schemas live in
`apps/backend/gauntlet/shared/schemas.py` and are **frozen**: changing a field
means updating this file, the fixtures, and the frontend types together.

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/policies` | – | `string[]` policy ids (yaml filenames without extension) |
| POST | `/api/run` | `{policy_id, target_url?}` | `{run_id}`; the pipeline runs as a background task |
| GET | `/api/run/{run_id}` | – | `RunStatus` (poll every 1s until `done`/`error`) |
| POST | `/api/run/{run_id}/regress` | – | `{results: [{test_id, passed}], gate}` |

`target_url` defaults to the backend's `TARGET_URL` env var.

## Schemas

```
JudgeVerdict   { succeeded: bool, confidence: float, reasoning: str, violated_rule: str | null }
AttackRecord   { attack_id, run_id, timestamp (ISO 8601 UTC), attack_type ("prompt_injection" | "unauthorized_tool_action"),
                 prompt, target_response, tool_calls: str[], judge: JudgeVerdict, trace_id }
RegressionTest { test_id, source_attack_id, language ("python"), code, assertion }
RunStatus      { run_id, status ("pending" | "running" | "done" | "error"), gate ("RED" | "GREEN" | null),
                 attacks: AttackRecord[], regression_tests: RegressionTest[] }
Policy         { agent, forbidden_actions: str[], allowed_actions: str[], max_response_length: int }
```

## ID formats

| ID | Format | Notes |
|---|---|---|
| run | `run_YYYYMMDD_NNN` | NNN counts up per UTC day |
| attack | `atk_NNN` | per run |
| trace | `trc_<12 hex>` | first 12 hex of sha256(policy_id + prompt + target_url); same input → same id |
| regression test | `reg_NNN` | unique across runs; file is `regression_tests/generated/test_<test_id>.py` |

`violated_rule` uses the form `forbidden_actions[i]` (index into the policy).

## Target agent contract (port 8001)

`POST /chat {message}` → `{response, tool_calls: string[]}`. Tool calls are strings like `delete_record(42)`.

## Example

See `apps/backend/data/recorded_run/run.json` (identical to `apps/frontend/mocks/run_mock.json`).
