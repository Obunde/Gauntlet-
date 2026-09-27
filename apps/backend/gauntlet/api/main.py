"""FastAPI app for the dashboard. Port 8000. Owner: BE2.

API_MODE=mock serves api/mock.py. API_MODE=live is wired to the pipeline in Sprint 2;
until then every route except /api/health and /api/policies returns 501.
"""
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gauntlet.api import mock
from gauntlet.core.policy import list_policies
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


def _require_mock() -> None:
    # TODO BE2 sprint 2: call the live pipeline (BE1's run_pipeline) instead of 501.
    if config.API_MODE != "mock":
        raise HTTPException(501, "live mode not wired yet (Sprint 2)")


@app.get("/api/health", response_model=Health)
def health() -> Health:
    return Health(ok=True, mode=config.API_MODE)


@app.get("/api/policies", response_model=list[str])
def get_policies() -> list[str]:
    return list_policies()


@app.post("/api/run", response_model=StartRunResponse)
def start_run(body: StartRunRequest) -> StartRunResponse:
    _require_mock()
    try:
        return mock.start_run(body)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.get("/api/run/{run_id}", response_model=RunStatus)
def get_run(run_id: str) -> RunStatus:
    _require_mock()
    run = mock.get_run(run_id)
    if run is None:
        raise HTTPException(404, f"Unknown run: {run_id}")
    return run


@app.post("/api/run/{run_id}/regress", response_model=RegressionRun)
def regress(run_id: str) -> RegressionRun:
    _require_mock()
    try:
        return mock.regress(run_id)
    except KeyError as exc:
        raise HTTPException(404, f"Unknown run: {run_id}") from exc
    except RuntimeError as exc:
        raise HTTPException(409, str(exc)) from exc


@app.post("/api/target/guard", response_model=GuardResponse)
def set_guard(body: GuardRequest) -> GuardResponse:
    _require_mock()
    return mock.set_guard(body)
