# Project Card: Gauntlet

**Team Name:** Null Terminators
**Project Title:** Gauntlet
**One-Line Story:** An automated AI security release gate that converts adversarial vulnerabilities into permanent regression tests, ensuring bugs stay fixed forever.

**Team Members:**

* **Tristan (Backend Engineer 1):** AI Engine, Brev Attacker & Judge, Telemetry

* **Eugene (Backend Engineer 2):** Logic Backend, Policy Parser, Gate Logic, Regression Generator

* **Ingrid (Frontend Engineer 1):** Dashboard, Main Run View, RED/GREEN Status

* **Lameck (Frontend Engineer 2):** Detail Views, Trace Viewer, Regression Test Display

* **Silas (Product Manager):** Pipeline Integrator, Brev Setup, Sandbox Target Agent

### Project Summary 

Development teams shipping AI agents lack automated security testing, causing patched OWASP vulnerabilities (like prompt injection) to return in later releases. Gauntlet is an enterprise-grade automated security release gate that blocks vulnerable AI apps from shipping. Our core feature generates adversarial attacks against a target agent, evaluates policy compliance, and automatically synthesizes deterministic Pytest regression test suites. We used `nvidia/llama-3.1-nemotron-70b-instruct` hosted on an NVIDIA Brev L40S GPU for both generating context-aware attacks and judging agent responses. Testing on our sandbox proved Gauntlet successfully catches unauthorized tool calls and locks the release gate RED. Once patched, it turns GREEN. A current limitation is that our test generation relies on static templates rather than dynamic code synthesis. Our next step is integrating Gauntlet directly into GitHub Actions so every pull request automatically runs this adversarial gate before merging.

### The Problem

Teams shipping AI-powered applications have no automated way to test for adversarial vulnerabilities before release. OWASP Top 10 threats—like prompt injection (LLM01) and unauthorized tool actions (LLM06)—routinely reach production because security testing is manual and disconnected from the release pipeline. Existing scanners detect bugs, but they fail to close the loop: when a vulnerability is patched ad hoc, it frequently regresses in a later sprint.

### Solution & Key Features

Gauntlet is a security checkpoint that sits between an AI application and production.

* **Automated Red-Teaming:** Generates adversarial tests based on a YAML security policy.

* **NVIDIA Brev AI Judge & Telemetry:** Evaluates responses using a Brev-hosted LLM, complete with real-time token and latency tracking.

* **Failure Clustering:** Groups failed attack traces by violated rules and ranks them by risk severity.

* **Automated Regression Generation:** Converts every successful attack into a permanent Pytest regression test suite.

* **Release Gate (RED/GREEN):** Blocks the release on breach (RED), and clears it to ship (GREEN) when the vulnerability is patched.

### Technologies Used

* **AI / Compute:** `nvidia/llama-3.1-nemotron-70b-instruct` hosted on an NVIDIA Brev L40S 48GB GPU.

* **Backend:** Python 3.11, FastAPI, Pytest, PyYAML, Pydantic, Docker.

* **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS.

### Transparent AI & Tool Disclosure

* **Models & APIs Used:** We utilized `nvidia/llama-3.1-nemotron-70b-instruct` hosted on an NVIDIA Brev L40S 48GB GPU instance via an OpenAI-compatible endpoint. Code scaffolding was assisted by Claude.

* **Chosen Stack & Constraints:** We enforced a strict API contract between a FastAPI backend and a Next.js frontend, deployed via Docker Compose, to allow parallel development without blocking each other.

* **Actual AI Contribution:** The AI handles two non-deterministic tasks: (1) "Attacker" - generating multi-shot OWASP-aligned adversarial prompts to bypass security policies, and (2) "Judge" - semantically evaluating tool calls and responses to determine rule violations.

* **Fallback Strategy:** If the Brev endpoints fail or rate-limit, the system automatically falls back to a deterministic rule-based judge and injects pre-written JSON attacks via a built-in mock mode.

* **Responsible AI & Data:** No real user data was utilized. All testing targeted a synthesized, deliberately vulnerable sandbox agent built purely for this demo.

### Next Steps

Our immediate next step is packaging Gauntlet as a frictionless CI/CD plugin (GitHub Actions and GitLab CI) to automate the gate decision on every code merge. We also plan to expand our detection scope to include dynamic PII leakage detection and complex jailbreak attempts (OWASP LLM02 and LLM07).