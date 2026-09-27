"""FastAPI app for the dashboard. Port 8000. Owner: BE2 & BE1."""
from datetime import datetime, timezone

import httpx
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from gauntlet.api import mock
from gauntlet.core import finalize
from gauntlet.core.policy import list_policies
from gauntlet.core.regression import run_tests
from gauntlet.engine import brev_client
from gauntlet.pipeline import orchestrator, trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import (
    BrevTelemetryResponse,
    GuardRequest,
    GuardResponse,
    HealthResponse,
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


def _mock_mode() -> bool:
    return config.api_mode() == "mock"


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    mode = config.api_mode()
    ready = finalize.pipeline_ready() if hasattr(finalize, "pipeline_ready") else True
    return HealthResponse(ok=True, mode="mock" if mode == "mock" else "live", pipeline_ready=ready)


@app.get("/api/brev/telemetry", response_model=BrevTelemetryResponse)
def brev_telemetry() -> BrevTelemetryResponse:
    """Return live Brev GPU usage metrics, hardware specs, and token counts."""
    data = brev_client.get_telemetry_summary()
    return BrevTelemetryResponse(**data)


@app.get("/api/policies", response_model=list[str])
def get_policies() -> list[str]:
    return list_policies()


@app.post("/api/run", response_model=StartRunResponse)
def start_run(body: StartRunRequest, background: BackgroundTasks) -> StartRunResponse:
    if body.policy_id not in list_policies():
        raise HTTPException(404, f"Unknown policy: {body.policy_id}")

    if _mock_mode():
        return mock.start_run(body)

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
def target_guard(body: GuardRequest) -> GuardResponse:
    """Toggle target agent hardening mode."""
    if _mock_mode():
        return mock.set_guard(body)
    target = config.target_url().rstrip("/")
    try:
        resp = httpx.post(f"{target}/admin/guard", json={"enabled": body.enabled}, timeout=5.0)
        resp.raise_for_status()
        data = resp.json()
        return GuardResponse(enabled=bool(data.get("enabled", body.enabled)))
    except Exception as exc:
        raise HTTPException(502, f"Target agent guard toggle failed: {exc}") from exc
