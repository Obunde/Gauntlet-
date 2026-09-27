"""FastAPI app for the dashboard. Port 8000. Owner: BE2.

API_MODE=mock serves api/mock.py. API_MODE=live runs BE1's pipeline as a background task and
finalizes the run in core/finalize.py (see docs/api-contract.md).
"""
from typing import Literal

import httpx
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError

from gauntlet.api import mock
from gauntlet.core import finalize
from gauntlet.core.policy import list_policies
from gauntlet.core.regression import run_tests
from gauntlet.pipeline import trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import (
    GuardRequest,
    GuardResponse,
    RegressionRun,
    RunStatus,
    StartRunRequest,
    StartRunResponse,
)

app = FastAPI(title="Gauntlet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Health(BaseModel):
    ok: bool
    mode: Literal["mock", "live"]
    pipeline_ready: bool


def _mock_mode() -> bool:
    return config.API_MODE == "mock"


@app.get("/api/health", response_model=Health)
def health() -> Health:
    return Health(ok=True, mode=config.API_MODE, pipeline_ready=finalize.pipeline_ready())


@app.get("/api/policies", response_model=list[str])
def get_policies() -> list[str]:
    return list_policies()


@app.post("/api/run", response_model=StartRunResponse)
def start_run(body: StartRunRequest, background: BackgroundTasks) -> StartRunResponse:
    try:
        if _mock_mode():
            return mock.start_run(body)
        run_id = finalize.start_run(body.policy_id, body.target_url)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc
    background.add_task(finalize.execute_run, run_id, body.policy_id, body.target_url)
    return StartRunResponse(run_id=run_id)


@app.get("/api/run/{run_id}", response_model=RunStatus)
def get_run(run_id: str) -> RunStatus:
    run = mock.get_run(run_id) if _mock_mode() else trace_store.load_run(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run: {run_id}")
    return run


@app.post("/api/run/{run_id}/regress", response_model=RegressionRun)
async def regress(run_id: str) -> RegressionRun:
    if _mock_mode():
        try:
            return await run_in_threadpool(mock.regress, run_id)
        except KeyError as exc:
            raise HTTPException(404, f"Unknown run: {run_id}") from exc
        except RuntimeError as exc:
            raise HTTPException(409, str(exc)) from exc

    run = trace_store.load_run(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run: {run_id}")
    if run.status != "done":
        raise HTTPException(409, f"Run {run_id} is {run.status}, not done")
    if not run.regression_tests:
        raise HTTPException(409, f"Run {run_id} has no regression tests")
    rr = await run_in_threadpool(run_tests, run_id, run.target_url)
    trace_store.add_regression_run(run_id, rr)
    return rr


@app.post("/api/target/guard", response_model=GuardResponse)
def set_guard(body: GuardRequest) -> GuardResponse:
    if _mock_mode():
        return mock.set_guard(body)
    url = config.TARGET_URL.rstrip("/") + "/admin/guard"
    try:
        resp = httpx.post(url, json=body.model_dump(), timeout=5)
        resp.raise_for_status()
        return GuardResponse.model_validate(resp.json())
    except (httpx.HTTPError, ValueError, ValidationError) as exc:
        raise HTTPException(502, f"Target agent guard at {url} failed: {exc}") from exc
