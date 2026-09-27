"""FastAPI app for the dashboard. Port 8000. Owner: PD (endpoints), BE2 (regress)."""
import subprocess
import sys
from typing import Literal

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gauntlet.core import regression
from gauntlet.core.policy import list_policies
from gauntlet.pipeline import orchestrator, trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import RunStatus

app = FastAPI(title="Gauntlet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    policy_id: str = "customer_support"
    target_url: str | None = None


class RunStarted(BaseModel):
    run_id: str


class RegressTestResult(BaseModel):
    test_id: str
    passed: bool


class RegressResponse(BaseModel):
    results: list[RegressTestResult]
    gate: Literal["RED", "GREEN"]


@app.get("/api/policies", response_model=list[str])
def get_policies() -> list[str]:
    return list_policies()


@app.post("/api/run", response_model=RunStarted)
def start_run(body: RunRequest, background: BackgroundTasks) -> RunStarted:
    if body.policy_id not in list_policies():
        raise HTTPException(404, f"Unknown policy: {body.policy_id}")
    run_id = trace_store.new_run_id()
    trace_store.save_run(RunStatus(run_id=run_id, status="pending"))
    background.add_task(orchestrator.run_pipeline, run_id, body.policy_id, body.target_url or config.target_url())
    return RunStarted(run_id=run_id)


@app.get("/api/run/{run_id}", response_model=RunStatus)
def get_run(run_id: str) -> RunStatus:
    run = trace_store.load_run(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run: {run_id}")
    return run


@app.post("/api/run/{run_id}/regress", response_model=RegressResponse)
def regress(run_id: str) -> RegressResponse:
    """Re-run this run's generated tests against the (possibly hardened) target."""
    run = get_run(run_id)
    results = []
    for test in run.regression_tests:
        path = regression.generated_file(test.test_id)
        proc = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", str(path)],
            cwd=config.BACKEND_DIR,
            capture_output=True,
            text=True,
        )
        # TODO(BE2): return pytest output per test so the dashboard can show failures.
        results.append(RegressTestResult(test_id=test.test_id, passed=proc.returncode == 0))
    gate = "GREEN" if all(r.passed for r in results) else "RED"
    return RegressResponse(results=results, gate=gate)
