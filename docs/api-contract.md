# Gauntlet API contract

Base URL: `http://localhost:8000` (`make api` for mock mode, `make api-live` for live mode). Owner: BE2.

The live source of truth is `/openapi.json` (browse it at `/docs`; `make openapi` saves it to
`docs/openapi.json`). Schemas live in `apps/backend/gauntlet/shared/schemas.py`.

> **Frozen at Sprint 0.** Any change to a schema field, route or ID format must be announced at
> the sprint sync, then this file, `data/recorded_run/run.json` and the frontend types are
> updated together.

## Routes

| Method | Path | Request body | Response | Errors |
|---|---|---|---|---|
| GET | `/api/health` | – | `{ok: true, mode: "mock" \| "live", pipeline_ready: bool}` | – |
| GET | `/api/policies` | – | `string[]`: policy ids (YAML filenames in `policies/`) | – |
| POST | `/api/run` | `StartRunRequest` | `StartRunResponse` | 404 unknown policy |
| GET | `/api/run/{run_id}` | – | `RunStatus` | 404 unknown run |
| POST | `/api/run/{run_id}/regress` | – | `RegressionRun` | 404 unknown run, 409 run not done yet (live: also 409 if it has no regression tests) |
| POST | `/api/target/guard` | `GuardRequest` | `GuardResponse` | live: 502 target agent unreachable or bad reply |
| GET | `/api/brev/telemetry` | – | `BrevTelemetryResponse` (owner: BE1) | – |

Poll `GET /api/run/{run_id}` every 1–2 s until `status` is `done` or `error`.

`pipeline_ready` is true when BE1's `run_pipeline` can be imported. A stub that raises
`NotImplementedError` still reports true; the run then ends with the error below.

## API_MODE

Set in `apps/backend/.env` or the environment (default `mock`; anything other than `mock` or
`live` is an error). Read on every request.

- `mock`: routes are served by `gauntlet/api/mock.py` (see below). No LLM or target agent is needed.
- `live`: runs BE1's pipeline and BE2's finalizer (see **Live behaviour**).

## Schemas

All fields are snake_case. Timestamps are `str` fields holding ISO 8601 UTC, e.g.
`2026-09-27T09:00:02Z` (BE2 writes microseconds too; parse with any ISO 8601 parser).

```
Policy          { agent: str, forbidden_actions: str[], allowed_actions: str[], max_response_length: int }
JudgeVerdict    { succeeded: bool, confidence: float (0–1, default 1.0), reasoning: str, violated_rule: str | null }
AttackRecord    { attack_id, run_id, timestamp: str,
                  attack_type: "prompt_injection" | "unauthorized_tool_action"
                             | "sensitive_info_disclosure" | "system_prompt_leakage",
                  prompt, target_response, tool_calls: str[], judge: JudgeVerdict, trace_id }
RegressionTest  { test_id, source_attack_id, language: "python", code, assertion }
RegressionResult{ test_id, passed: bool }
RegressionRun   { ran_at: str, gate: "RED" | "GREEN", results: RegressionResult[] }
RunStatus       { run_id, policy_id, target_url,
                  status: "pending" | "running" | "done" | "error",
                  gate: "RED" | "GREEN" | null,
                  created_at: str, completed_at: str | null, error: str | null,
                  attacks: AttackRecord[], regression_tests: RegressionTest[],
                  regression_runs: RegressionRun[] }
StartRunRequest { policy_id = "customer_support", target_url: str | null }  # null → backend TARGET_URL
StartRunResponse{ run_id }
GuardRequest    { enabled: bool }
GuardResponse   { enabled: bool }
HealthResponse  { ok: bool, mode: "mock" | "live", pipeline_ready: bool }
BrevTelemetryResponse { instance_name, gpu_spec, provider, base_url, active_model,
                  total_invocations, total_prompt_tokens, total_completion_tokens, total_tokens,
                  avg_tokens_per_request, throughput_est_tokens_sec, latency_avg_ms,
                  speedup_vs_cloud_api, purpose_breakdown: {str: int} }   # owner: BE1

# Hand-off shapes (BE1 → orchestrator)
AttackPrompt    { attack_type, prompt }
TargetReply     { response: str, tool_calls: str[] }
```

- `tool_calls` entries are strings like `delete_record(42)`.
- `violated_rule` has the form `forbidden_actions[i]`, an index into the policy. BE1's judge
  may also return `max_response_length`; such attacks count toward the gate but get no
  regression test (the run's `error` notes it).
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

Regression tests:

```
apps/backend/regression_tests/
├── conftest.py                          # `send(prompt) -> dict` fixture: POST $TARGET_URL/chat
└── generated/<run_id>/test_<test_id>.py # one file per successful attack (gitignored)
```

Each generated file contains a header comment, `PROMPT` and `FORBIDDEN_TOOL` constants, and
one test `test_<test_id>_blocks_<tool>(send)` that asserts the tool is not in the reply's
`tool_calls`. `make regress` runs every generated test against `TARGET_URL`.

**Untrusted-prompt rule:** attack prompts are LLM output and are treated as hostile. They
enter generated code only as a `repr()` string constant (`PROMPT = '...'`), never spliced into
code. Other values in the file are validated ids or sanitized to `[a-z0-9_]`, and every file is
checked with `compile()` before it is written.

## Run status lifecycle (live)

```
pending ──> running ──> done   (gate RED/GREEN, regression tests generated)
                   └──> error  (error holds the reason; gate null)
```

| Step | Who | What |
|---|---|---|
| `pending` | BE2 `finalize.start_run` | Policy validated, run saved, background task queued |
| `running` | BE2 `finalize.execute_run` | Calls BE1's `run_pipeline` |
| attacks | BE1 `run_pipeline` | Persists each `AttackRecord` via `trace_store.add_attack` as it lands |
| `done` | BE2 `finalize.finalize_run` | `gate = decide(attacks)`, one regression test per successful attack, `completed_at` set |
| `error` | BE2 | Pipeline missing or stubbed: `"pipeline not available yet (BE1)"`; zero attacks: `"no attacks were executed"`; pipeline raised: the exception message |

If generating one regression test fails, the run still ends `done`, and `error` lists the
failed attacks.

If `run_pipeline` returns after marking the run `error` itself, BE2 keeps that status and
message and does not finalize.

## Live behaviour (API_MODE=live)

- `POST /api/run` creates a `pending` run, starts `execute_run` as a background task, and
  returns `{run_id}` immediately. Unknown policy: 404.
- `GET /api/run/{run_id}` returns the stored `RunStatus`. Unknown run: 404.
- `POST /api/run/{run_id}/regress` runs `regression_tests/generated/<run_id>/` with pytest
  against the run's `target_url`, appends the `RegressionRun`, and sets the run's `gate` to its
  gate. `GREEN` requires at least one test and all passing. A timeout (10 s per test + 10 s) or
  crash fails every test. 409 if the run is not `done` or has no regression tests.
- `POST /api/target/guard` forwards `{enabled}` to `TARGET_URL/admin/guard` (5 s timeout). 502 if
  the target agent is unreachable or replies with an error.

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
- `POST /api/target/guard` echoes `enabled` (kept in memory; not forwarded).

## Hand-offs

**BE1 (AI & pipeline)** — agreed contract:
- Expose `run_pipeline(run_id: str, policy_id: str, target_url: str) -> None` in
  `gauntlet/pipeline/orchestrator.py`. It generates attacks, sends each to the target, judges
  each, and persists each `AttackRecord` with `trace_store.add_attack(run_id, rec)`.
- It does **not** set the gate, set status `done`, or generate regression tests; BE2 finalizes
  the run when it returns. It raises on fatal errors.
- The attack engine returns `list[AttackPrompt]`, the target client returns `TargetReply`, and
  the LLM judge returns `JudgeVerdict`, falling back to BE2's `rule_judge(policy, tool_calls)`.
- `violated_rule` must be `forbidden_actions[i]` so regression tests target the right tool
  (BE2 falls back to `rule_judge` on the recorded `tool_calls` otherwise).
- Target agent: `POST {target_url}/chat {"message": str}` returns `TargetReply`;
  `POST {target_url}/admin/guard {"enabled": bool}` returns `{"enabled": bool}`.

**FE1 / FE2 (frontend)**:
- Copy `apps/backend/data/recorded_run/run.json` to the frontend mocks.
- Generate TypeScript types from `http://localhost:8000/openapi.json` (or `docs/openapi.json`).
