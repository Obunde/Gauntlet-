# Gauntlet — Monorepo Scaffold & Build Guide

## Overview

Gauntlet ships as one monorepo with two apps: a Python/FastAPI backend and a Next.js frontend, joined only by the HTTP API contract.

Gauntlet is an automated security release gate for AI apps. It generates adversarial prompts on NVIDIA Brev, fires them at a target agent, judges the results on Brev, stores reproducible traces, turns every successful attack into a Pytest regression test, and returns a single RED/GREEN gate decision.

This doc covers the folder layout, every component the team needs to build, who owns it, how the two apps talk, and the order to build things in. It replaces the Streamlit dashboard from the BRD with Next.js; everything else follows the BRD's frozen stack.

## Repository structure

Each top-level folder inside an app has exactly one owner, which keeps merge conflicts rare.

```
gauntlet/
├── README.md
├── Makefile                          # make dev / agent / api / web / types / regress
├── .gitignore
├── .env.example                      # reference for both apps
│
├── apps/
│   ├── backend/                      # Python 3.11 + FastAPI
│   │   ├── pyproject.toml            # fastapi, uvicorn, openai, pyyaml, pytest, pydantic, httpx, python-dotenv
│   │   ├── .env.example              # BREV_BASE_URL, BREV_API_KEY, BREV_MODEL, TARGET_URL, HARDENED, CORS_ORIGINS
│   │   ├── policies/
│   │   │   └── customer_support.yaml
│   │   ├── gauntlet/
│   │   │   ├── shared/               # ALL, frozen at H1
│   │   │   │   ├── schemas.py        # Pydantic models = the contract
│   │   │   │   └── config.py
│   │   │   ├── engine/               # BE1
│   │   │   │   ├── brev_client.py
│   │   │   │   ├── attacker.py
│   │   │   │   ├── judge.py
│   │   │   │   └── prompts/
│   │   │   │       ├── attacker_system.md
│   │   │   │       └── judge_system.md
│   │   │   ├── core/                 # BE2
│   │   │   │   ├── policy.py
│   │   │   │   ├── gate.py
│   │   │   │   ├── regression.py
│   │   │   │   └── rule_judge.py
│   │   │   ├── pipeline/             # PD
│   │   │   │   ├── orchestrator.py
│   │   │   │   ├── target_client.py
│   │   │   │   └── trace_store.py
│   │   │   └── api/                  # BE2
│   │   │       └── main.py           # routes + CORS
│   │   ├── target_agent/             # PD, separate process
│   │   │   ├── app.py                # POST /chat -> {response, tool_calls}
│   │   │   ├── tools.py
│   │   │   └── guard.py              # HARDENED=1 -> gate goes GREEN
│   │   ├── regression_tests/
│   │   │   ├── conftest.py
│   │   │   └── generated/
│   │   ├── data/
│   │   │   ├── runs/
│   │   │   └── recorded_run/         # replay backup
│   │   ├── fallback/
│   │   │   └── attacks.json
│   │   └── tests/
│   │
│   └── frontend/                     # Next.js App Router + TypeScript + Tailwind
│       ├── package.json
│       ├── .env.local.example        # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USE_MOCKS
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx              # FE1: dashboard
│       │   └── runs/[runId]/
│       │       ├── page.tsx          # FE1: run view
│       │       └── attacks/[attackId]/
│       │           └── page.tsx      # FE2: trace + regression test
│       ├── components/
│       │   ├── RunButton.tsx         # FE1
│       │   ├── GateBadge.tsx         # FE1
│       │   ├── AttackList.tsx        # FE1
│       │   ├── ReplayToggle.tsx      # FE1
│       │   ├── TraceViewer.tsx       # FE2
│       │   └── RegressionCode.tsx    # FE2
│       ├── lib/
│       │   ├── api.ts
│       │   ├── types.ts              # GENERATED, never hand-edit
│       │   └── useRunPolling.ts
│       └── mocks/
│           └── run_mock.json
│
└── docs/
    ├── BRD.pdf
    ├── api-contract.md
    └── brev-usage-log.md
```

## Backend app

The backend is one Python package plus a separate target agent process; only the attacker and judge call Brev.

&#91;embedded content: backend pipeline · 9 components, 2 on Brev\]

The dashboard starts a run through the API; the orchestrator walks each attack through the pipeline and the dashboard polls the API for status.

| Component | File | Owner | Responsibility |
| --- | --- | --- | --- |
| Shared schemas | `shared/schemas.py` | All (frozen H1) | Pydantic models for AttackRecord, JudgeVerdict, RegressionTest, RunStatus, matching the BRD's frozen JSON |
| Brev client | `engine/brev_client.py` | BE1 | OpenAI-compatible client pointed at the Brev endpoint; logs tokens per call for the usage log |
| Attack engine | `engine/attacker.py` | BE1 | Policy in, \~10 varied injection prompts out, as JSON |
| Judge | `engine/judge.py` | BE1 | One exchange in, `succeeded`, `confidence`, `reasoning`, `violated_rule` out; temperature 0 |
| Policy parser | `core/policy.py` | BE2 | Loads the YAML policy into a Policy object |
| Gate | `core/gate.py` | BE2 | RED if any attack succeeded, else GREEN |
| Regression generator | `core/regression.py` | BE2 | Template (not LLM) that writes `test_reg_XXX.py` from the attack prompt and forbidden tool |
| Rule judge | `core/rule_judge.py` | BE2 | Fallback: forbidden tool present in `tool_calls` = success |
| Orchestrator | `pipeline/orchestrator.py` | PD | Generate, send, judge, store, then gate and regression for one run |
| Target client | `pipeline/target_client.py` | PD | `send(prompt)` returns response + tool calls |
| Trace store | `pipeline/trace_store.py` | PD | JSON under `data/runs/<run_id>/`; `trace_id` = hash of policy + prompt + target URL (NFR-06) |
| API | `api/main.py` | BE2 | FastAPI routes, background task per run, CORS for the frontend |
| Target agent | `target_agent/` | PD | Vulnerable FastAPI app on its own port; `guard.py` blocks forbidden tools when `HARDENED=1` |

## Frontend app (Next.js)

The frontend is three routes and six components, split so FE1 and FE2 never edit the same file.

| Route or component | Owner | What it does |
| --- | --- | --- |
| `app/page.tsx` | FE1 | Dashboard: policy picker, Run button, latest gate status |
| `app/runs/[runId]/page.tsx` | FE1 | Run view: polls status, shows gate badge and attack list |
| `app/runs/[runId]/attacks/[attackId]/page.tsx` | FE2 | Detail view: full trace and the generated regression test |
| `RunButton.tsx` | FE1 | Calls `POST /api/run`, routes to the run page |
| `GateBadge.tsx` | FE1 | Large RED/GREEN indicator, the demo's moment of truth |
| `AttackList.tsx` | FE1 | One row per attack: type, succeeded, confidence, link to detail |
| `ReplayToggle.tsx` | FE1 | Loads `data/recorded_run` instead of a live run |
| `TraceViewer.tsx` | FE2 | Prompt, response, tool calls, judge reasoning, timestamp, trace ID |
| `RegressionCode.tsx` | FE2 | Syntax-highlighted Pytest code with copy and download |
| `lib/api.ts` | FE1 | Fetch wrapper; returns `mocks/run_mock.json` when `NEXT_PUBLIC_USE_MOCKS=true` |
| `lib/useRunPolling.ts` | FE1 | Polls `GET /api/run/{id}` every \~1s until status is done |
| `lib/types.ts` | Generated | TypeScript types from the backend's OpenAPI spec |

Keep the UI to these three routes until after the H6 freeze. Next.js needs more setup than Streamlit did, so scope creep here costs the most.

## API contract & type sharing

`shared/schemas.py` is the single source of truth; the frontend's types are generated from it, never written by hand.

The BRD's `GET /api/run/{run_id}` response is cut off, so the shape below is a proposal to confirm at H1.

| Method | Endpoint | Request | Response |
| --- | --- | --- | --- |
| POST | `/api/run` | `{ policy_id, target_url }` | `{ run_id }`; pipeline starts as a background task |
| GET | `/api/run/{run_id}` | none | `{ status, gate, attacks: AttackRecord[], regression_tests: RegressionTest[] }` |
| POST | `/api/run/{run_id}/regress` | none | Runs generated Pytest files; returns pass/fail per test and the new gate |
| GET | `/api/policies` | none | List of policy IDs from `policies/` |

The AttackRecord and RegressionTest shapes are exactly the frozen JSON in BRD section 14.

Type generation works in three steps:

1. BE2 edits a model in `schemas.py`; FastAPI serves the updated spec at `/openapi.json`.
2. Anyone runs `make types`, which calls `npx openapi-typescript http://localhost:8000/openapi.json -o apps/frontend/lib/types.ts`.
3. The TypeScript compiler flags every frontend file that no longer matches.

Any schema change after H1 is announced at the next stand-up before it is merged.

## Local development

Three processes run locally, and `make dev` starts all of them in one terminal.

| Process | Port | Start command | Owner |
| --- | --- | --- | --- |
| Next.js frontend | 3000 | `make web` (`npm run dev`) | FE1 |
| Gauntlet API | 8000 | `make api` (`uvicorn gauntlet.api.main:app --reload`) | BE2 |
| Target agent | 8001 | `make agent` (`uvicorn target_agent.app:app --port 8001`) | PD |

Other make targets: `make types` regenerates frontend types; `make regress` runs `pytest regression_tests/generated`.

Environment variables:

- **Backend:** `BREV_BASE_URL`, `BREV_API_KEY`, `BREV_MODEL`, `TARGET_URL=http://localhost:8001`, `HARDENED=0`, `CORS_ORIGINS=http://localhost:3000`.
- **Frontend:** `NEXT_PUBLIC_API_URL=http://localhost:8000`, `NEXT_PUBLIC_USE_MOCKS=true` until the API is live.

BE2 adds FastAPI's `CORSMiddleware` in the first commit; without it the browser blocks every call from port 3000 to 8000.

Prerequisites: Python 3.11+ for backend roles, Node 20+ for FE1 and FE2, and the Brev CLI for PD. Commit only `.env.example` files, never real keys.

## Build order & milestones

The schemas, mock JSON and a live Brev endpoint must exist by H1, because every other role builds against them.

&#91;embedded content: build roadmap · 4 phases, 3 gates\]

If a gate slips, PD raises it at the next stand-up (H3, H6, H9) and the team switches to the matching fallback below rather than extending the phase.

## Sprint plan

This plan is built around the official schedule. One structural change: with the fifth person on documentation, **nobody is the dedicated integrator (PD) anymore**, so PD's backend work is split between the two backend developers.

### Roles

| Member | Owns |
|---|---|
| **BE1 — AI & pipeline** | LLM client (Brev if allocated, otherwise NVIDIA Build, Groq, or Gemini), attack engine, judge, target agent, orchestrator |
| **BE2 — Core & API** | Shared schemas, FastAPI routes, policy parser, trace store, gate, rule judge, regression generator |
| **FE1 — Dashboard** | Next.js shell, API client and mocks, Run button, gate badge, attack list, polling, replay mode |
| **FE2 — Detail views** | Attack detail page, trace viewer, regression code view, re-run regression button, "Top Issues" view (stretch) |
| **DOC — Docs & submission** | README, project card, presentation slides, video script and edit, AI/tool disclosure, award fit explanations, submission form |

Times below are the official Tunis-time schedule, with Nairobi times in brackets. Nairobi is two hours ahead. If your hackerspace runs on local time, shift everything, but the **17:30 Tunis (19:30 Nairobi) submission deadline is fixed**.

### Sprint 0 — Setup (09:45–11:15 [11:45–13:15])

Runs alongside the briefings and workshop, so some of the team will need to take turns attending.

| Member | Deliverables |
|---|---|
| BE1 | Confirm LLM access: Brev voucher by 10:15 if allocated, otherwise an NVIDIA Build or Groq key. One successful test completion. |
| BE2 | Run the scaffold prompt to generate the repo. Push `schemas.py` and API stubs returning mock data. Set up CORS. |
| FE1 | Next.js app runs. `mocks/run_mock.json` is in place. `lib/api.ts` works in mock mode. |
| FE2 | Empty pages for the run view and attack detail view, with routing working. |
| DOC | Lead verifies attendance by 10:00 Tunis. Create the slides file and README skeleton. Note the submission requirements from the 09:00 briefing. |

**Done when:** the repo is shared, the schemas are frozen, the frontend renders mock data, and the LLM responds.

### Sprint 1 — First working attack (11:15–13:00 [13:15–15:00])

Includes the 11:30 mentor checkpoint.

| Member | Deliverables |
|---|---|
| BE1 | Target agent on port 8001, with deterministic vulnerable mode and the `HARDENED` guard. Attack engine generating prompts from the policy. Fallback `attacks.json`. |
| BE2 | Policy parser, trace store with deterministic `trace_id`, gate logic, rule judge, and unit tests for each. |
| FE1 | Run button, gate badge, and attack list, all built on mocks. |
| FE2 | Trace viewer: prompt, response, tool calls, judge reasoning, timestamp, trace ID. |
| DOC | Drafts of the project summary (at most 150 words), problem statement, and solution/features. Slide outline. Notes from the mentor checkpoint. |

**Done when:** one attack sent to the target agent produces a `delete_record` call that gets stored as a trace.

### Sprint 2 — End-to-end pipeline (14:00–15:30 [16:00–17:30])

| Member | Deliverables |
|---|---|
| BE1 | LLM judge (temperature 0, falls back to the rule judge). Orchestrator running generate, send, judge, and store for about 10 attacks. |
| BE2 | Regression test generator, real API endpoints (`/run`, `/run/{id}`, `/regress`, `/policies`), and background task execution. |
| FE1 | Switch from mocks to the live API. Polling works, and the gate turns RED on a real run. |
| FE2 | Regression code view with copy and download. "Re-run regression tests" button. |
| DOC | Draft the AI/tool disclosure, the Responsible AI section, and the award fit explanations. Write the 90-second video script. Build the first version of the slides. |

**Done when:** a single click produces a real run in which the gate turns RED and a regression test file is generated. Confirm this at the 15:30 technical checkpoint.

### Sprint 3 — Prove, harden, and record (15:45–17:00 [17:45–19:00])

| Member | Deliverables |
|---|---|
| BE1 | Three clean runs in a row. Timings for the "testing and reliability" criterion. Pass the models and prompts used to DOC. |
| BE2 | Harden the agent, re-run the regressions, and confirm the gate turns GREEN. Save `data/recorded_run/` as a backup. *Stretch:* group failures by violated rule and rank them (for SupplyzPro). |
| FE1 | Replay mode and final polish. **Record the demo screen capture by 16:30 [18:30].** |
| FE2 | Finish the detail views. *Stretch:* "Top Issues" panel. Help FE1 record the video. |
| DOC | Edit the 90-second video. Finalise the slides, README, and disclosure. Make the repo public and upload the video and slides. |

**Feature freeze at 16:15 [18:15].** After that, only bug fixes.

### Sprint 4 — Submit (17:00–17:30 [19:00–19:30])

| Member | Deliverables |
|---|---|
| DOC | Fill in and submit the form using the same team name and lead email as the team confirmation. |
| All | Open every link (source code, presentation, video) in a private browser window. Fix anything broken. Keep the submission confirmation. |

**Target submission time: 17:15 [19:15]**, leaving 15 minutes of margin.

### Two things to keep in mind

* **DOC is your early warning system.** Their drafts depend on real details (model names, timings, features), so the other four should send those over the moment they exist, not at the end.
* **Assign a stand-in integrator.** With no PD, someone has to own "does the whole thing run end to end." BE2 is the natural choice, since the API sits at the centre. Hold a 5-minute sync at the start of each sprint.

## Fallbacks

Every row of the BRD's failure playbook maps to a switch already built into the scaffold, so no fallback needs new code on demo day.

| Failure | Switch in the scaffold | Owner |
| --- | --- | --- |
| Brev instance down | Attacker reads `fallback/attacks.json`; judge swaps to `core/rule_judge.py` | BE1 |
| Judge unreliable | `rule_judge.py`: forbidden tool in `tool_calls` = attack succeeded | BE2 |
| Regression gen slow | Template generator, no LLM; pre-generated file for the demo attack as backup | BE2 |
| API endpoints break | `NEXT_PUBLIC_USE_MOCKS=true` serves `mocks/run_mock.json` | FE1 |
| Gate doesn't render live | `ReplayToggle` loads `data/recorded_run/` | FE1 + PD |
| Target agent flaky | Deterministic mode in `target_agent/app.py` obeys any "ignore previous instructions" message | PD |

PD records the replay run after the H6 freeze, once three clean runs pass.

## Open items

Five decisions and BRD fixes need an owner before H1.

- [ ] Confirm the full `GET /api/run/{run_id}` response shape (BRD section 13 is cut off). Owner: BE2.
- [ ] Replace Streamlit with Next.js + TypeScript + Tailwind in BRD section 11 and the project card's Tools Used.
- [ ] Swap "Install Streamlit" for "Install Node 20+" in the pre-event checklist for FE1 and FE2.
- [ ] Add PD to the roles table (section 10) and sign-off table (section 26); finish FE2's row.
- [ ] Decide whether the target agent runs on a Brev LLM or deterministic mode by default for the live demo. Owner: PD.

Official submission requirements and rubric, checked against this plan: Hackathon requirements checklist
