# Gauntlet API contract

Base URL: `http://localhost:8000` (`make api`). Owner: BE2.

The live source of truth is `/openapi.json` (browse it at `/docs`; `make openapi` saves it to
`docs/openapi.json`). Schemas live in `apps/backend/gauntlet/shared/schemas.py`.

> **Frozen at Sprint 0.** Any change to a schema field, route or ID format must be announced at
> the sprint sync, then this file, `data/recorded_run/run.json` and the frontend types are
> updated together.

## Routes

| Method | Path | Request body | Response | Errors |
|---|---|---|---|---|
| GET | `/api/health` | – | `{ok: true, mode: "mock" \| "live"}` | – |
| GET | `/api/policies` | – | `string[]`: policy ids (YAML filenames in `policies/`) | – |
| POST | `/api/run` | `StartRunRequest` | `StartRunResponse` | 404 unknown policy |
| GET | `/api/run/{run_id}` | – | `RunStatus` | 404 unknown run |
| POST | `/api/run/{run_id}/regress` | – | `RegressionRun` | 404 unknown run, 409 run not done yet |
| POST | `/api/target/guard` | `GuardRequest` | `GuardResponse` | – |

Poll `GET /api/run/{run_id}` every 1–2 s until `status` is `done` or `error`.

## API_MODE

Set in `apps/backend/.env` (default `mock`).

- `mock`: routes are served by `gauntlet/api/mock.py` (see below). No LLM or target agent is needed.
- `live`: wired to the real pipeline in Sprint 2. Until then, every route except `/api/health`
  and `/api/policies` returns **501** `{"detail": "live mode not wired yet (Sprint 2)"}`.

## Schemas

All fields are snake_case. Datetimes are ISO 8601 UTC strings, e.g. `2026-09-27T09:00:02Z`.

```
Policy          { agent: str, forbidden_actions: str[], allowed_actions: str[], max_response_length: int }
JudgeVerdict    { succeeded: bool, confidence: float (0–1), reasoning: str, violated_rule: str | null }
AttackRecord    { attack_id, run_id, timestamp: datetime,
                  attack_type: "prompt_injection" | "unauthorized_tool_action",
                  prompt, target_response, tool_calls: str[], judge: JudgeVerdict, trace_id }
RegressionTest  { test_id, source_attack_id, language: "python", code, assertion }
RegressionResult{ test_id, passed: bool }
RegressionRun   { ran_at: datetime, gate: "RED" | "GREEN", results: RegressionResult[] }
RunStatus       { run_id, policy_id, target_url,
                  status: "pending" | "running" | "done" | "error",
                  gate: "RED" | "GREEN" | null,
                  created_at: datetime, completed_at: datetime | null, error: str | null,
                  attacks: AttackRecord[], regression_tests: RegressionTest[],
                  regression_runs: RegressionRun[] }
StartRunRequest { policy_id, target_url }
StartRunResponse{ run_id }
GuardRequest    { enabled: bool }
GuardResponse   { enabled: bool }

# Hand-off shapes (BE1 → orchestrator)
AttackPrompt    { attack_type, prompt }
TargetReply     { response: str, tool_calls: str[] }
```

- `tool_calls` entries are strings like `delete_record(42)`.
- `violated_rule` has the form `forbidden_actions[i]`, an index into the policy.
- `RunStatus.gate` is the latest verdict: the pipeline's gate, overwritten by the most recent
  `RegressionRun.gate`.

## ID formats

| ID | Format | Notes |
|---|---|---|
| run | `run_YYYYMMDD_NNN` | NNN counts up per UTC day |
| attack | `atk_NNN` | per run |
| regression test | `reg_NNN` | |
| trace | `trc_<12 hex>` | first 12 hex chars of `sha256(policy_id + prompt + target_url)`; same input, same id |

## Storage layout

```
apps/backend/data/
├── runs/<run_id>/run.json     # the full RunStatus aggregate, one file per run (gitignored)
└── recorded_run/run.json      # fixed example run: mock template and frontend mock source
```

`pipeline/trace_store.py` writes atomically (`run.json.tmp` then `os.replace`) under a per-run
lock. Functions: `save_run`, `load_run`, `list_runs`, `next_run_id`, `make_trace_id`,
`add_attack`, `add_regression_run`.

## Mock behaviour (API_MODE=mock)

- `POST /api/run` validates the policy, reserves a new `run_id`, and saves a `running` run with
  empty lists.
- `GET /api/run/{run_id}` reveals one attack from `data/recorded_run/run.json` **every 2 seconds**
  after `created_at`, rewriting `run_id` and computing `trace_id` from the request's
  `policy_id`/`target_url`. While revealing, `status` is `running` and `gate` is `null`. After all
  4 attacks (about 8 s), `status` is `done`, `gate` is `RED`, `completed_at` is set and the
  template's regression tests are included.
- `POST /api/run/{run_id}/regress` appends a `RegressionRun` where every test passed and
  `gate` is `GREEN`; the run's top-level `gate` becomes `GREEN`.
- `POST /api/target/guard` echoes `enabled` (kept in memory; forwarding to the target agent is
  Sprint 2).

## Hand-offs

**BE1 (AI & pipeline)** — for Sprint 2 wiring:
- The attack engine returns `list[AttackPrompt]`.
- The target client returns `TargetReply`.
- The LLM judge returns `JudgeVerdict`, falling back to BE2's `rule_judge(policy, tool_calls)`.
- Expose `run_pipeline(run_id: str, policy_id: str, target_url: str) -> None` in
  `gauntlet/pipeline/orchestrator.py`. It should store progress through `trace_store`
  (`add_attack`, `save_run`) so polling sees attacks as they land.

**FE1 / FE2 (frontend)**:
- Copy `apps/backend/data/recorded_run/run.json` to the frontend mocks.
- Generate TypeScript types from `http://localhost:8000/openapi.json` (or `docs/openapi.json`).
