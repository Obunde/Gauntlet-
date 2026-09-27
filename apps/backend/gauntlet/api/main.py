from datetime import datetime, timezone
import subprocess
import sys

import httpx
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from gauntlet.core import regression
from gauntlet.core.policy import list_policies
from gauntlet.pipeline import orchestrator, trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import (
    GuardRequest,
    GuardResponse,
    HealthResponse,
    RegressionResult,
    RegressionRun,
    RunStatus,
    StartRunRequest,
    StartRunResponse,
)

app = FastAPI(title="Gauntlet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    mode = config.env("API_MODE", "live")
    return HealthResponse(ok=True, mode="mock" if mode == "mock" else "live", pipeline_ready=True)


@app.get("/api/policies", response_model=list[str])
def get_policies() -> list[str]:
    return list_policies()


@app.post("/api/run", response_model=StartRunResponse)
def start_run(body: StartRunRequest, background: BackgroundTasks) -> StartRunResponse:
    if body.policy_id not in list_policies():
        raise HTTPException(404, f"Unknown policy: {body.policy_id}")
    run_id = trace_store.new_run_id()
    target = body.target_url or config.target_url()
    run = RunStatus(
        run_id=run_id,
        policy_id=body.policy_id,
        target_url=target,
        status="pending",
        created_at=_now(),
    )
    trace_store.save_run(run)
    background.add_task(orchestrator.run_pipeline, run_id, body.policy_id, target)
    return StartRunResponse(run_id=run_id)


@app.get("/api/run/{run_id}", response_model=RunStatus)
def get_run(run_id: str) -> RunStatus:
    run = trace_store.load_run(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run: {run_id}")
    return run


@app.post("/api/run/{run_id}/regress", response_model=RegressionRun)
def regress(run_id: str) -> RegressionRun:
    """Re-run this run's generated tests against the target URL."""
    run = get_run(run_id)
    if run.status != "done":
        raise HTTPException(409, f"Run {run_id} is not done yet")
    if not run.regression_tests:
        raise HTTPException(409, f"Run {run_id} has no regression tests")

    results = []
    for test in run.regression_tests:
        path = regression.generated_file(test.test_id)
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", str(path)],
            cwd=config.BACKEND_DIR,
            capture_output=True,
            text=True,
        )
        results.append(RegressionResult(test_id=test.test_id, passed=proc.returncode == 0))

    gate_verdict = "GREEN" if (results and all(r.passed for r in results)) else "RED"
    reg_run = RegressionRun(ran_at=_now(), gate=gate_verdict, results=results)
    run.regression_runs.append(reg_run)
    run.gate = gate_verdict
    trace_store.save_run(run)
    return reg_run


@app.post("/api/target/guard", response_model=GuardResponse)
def target_guard(body: GuardRequest) -> GuardResponse:
    """Toggle target agent hardening mode."""
    target = config.target_url().rstrip("/")
    try:
        resp = httpx.post(f"{target}/admin/guard", json={"enabled": body.enabled}, timeout=5.0)
        resp.raise_for_status()
        data = resp.json()
        return GuardResponse(enabled=bool(data.get("enabled", body.enabled)))
    except Exception as exc:
        raise HTTPException(502, f"Target agent guard toggle failed: {exc}") from exc

