# Gauntlet

An AI security release gate. Gauntlet generates adversarial prompts with an LLM hosted on
NVIDIA Brev, fires them at a target AI agent, judges each result with a second Brev call,
stores reproducible traces, turns every successful attack into a Pytest regression test, and
returns one decision: **RED (cannot ship)** or **GREEN (clear to ship)**.

```
attacker (Brev) → target agent → judge (Brev) → traces (JSON) → gate → pytest regression tests
```

## Prerequisites

- Python 3.11+
- Node.js 18.17+ and npm
- A Brev OpenAI-compatible endpoint (optional: everything runs offline with the fallback flags)

## Setup

```bash
make install                                     # venv in apps/backend/.venv + npm install
cp apps/backend/.env.example apps/backend/.env   # add Brev credentials
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

## Run

```bash
make dev        # target agent :8001, API :8000, dashboard :3000
```

Offline demo (no Brev needed):

```bash
USE_FALLBACK_ATTACKS=1 USE_RULE_JUDGE=1 make dev
curl -X POST localhost:8000/api/run -H 'content-type: application/json' -d '{"policy_id":"customer_support"}'
curl localhost:8000/api/run/<run_id>          # gate: RED, tests in apps/backend/regression_tests/generated/
make harden                                    # in another terminal: restarts the agent with HARDENED=1
curl -X POST localhost:8000/api/run/<run_id>/regress   # all passed, gate: GREEN
```

Set `NEXT_PUBLIC_USE_MOCKS=false` in `apps/frontend/.env.local` to point the dashboard at the live API.

## Make targets

| Target | What it does |
|---|---|
| `install` | Backend venv + editable install, frontend `npm install` |
| `agent` / `api` / `web` | Run one service |
| `dev` | All three via `npx concurrently` |
| `types` | Regenerate `apps/frontend/lib/types.ts` from the running API's OpenAPI |
| `test` | Backend unit tests |
| `regress` | Run all generated regression tests against `TARGET_URL` |
| `harden` | Restart the target agent with `HARDENED=1` |

## Layout & ownership

Search for `TODO(<owner>)` to find your open work.

| Owner | Area |
|---|---|
| **BE1** | `gauntlet/engine/`: Brev client, attacker, judge, prompts, `docs/brev-usage-log.md` |
| **BE2** | `gauntlet/core/`: policy, gate, rule judge, regression generator; `regression_tests/`, `tests/` |
| **PD** | `gauntlet/pipeline/`, `gauntlet/api/`, `target_agent/`, fixtures, `docs/api-contract.md` |
| **FE1** | Home page, run page, `lib/`, `RunButton`, `GateBadge`, `AttackList`, `ReplayToggle` |
| **FE2** | Attack detail page, `TraceViewer`, `RegressionCode` |

Environment flags (backend): `USE_FALLBACK_ATTACKS=1` uses `fallback/attacks.json`,
`USE_RULE_JUDGE=1` uses the deterministic rule judge, `HARDENED=1` turns on the target's guard.
Never commit `.env` files; only the `.env.example` files are tracked.
