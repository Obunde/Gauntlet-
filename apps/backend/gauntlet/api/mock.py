"""Progressive mock backed by data/recorded_run/run.json (API_MODE=mock). Owner: BE2.

Reveals one template attack every REVEAL_SECONDS after the run's created_at, then marks
the run done with the template's gate and regression tests. Start time is read from the
persisted created_at, so runs keep progressing across `uvicorn --reload` restarts.
"""
from datetime import datetime, timedelta, timezone

from gauntlet.core.policy import load_policy
from gauntlet.pipeline import trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import (
    GuardRequest,
    GuardResponse,
    RegressionResult,
    RegressionRun,
    RunStatus,
    StartRunRequest,
    StartRunResponse,
)

REVEAL_SECONDS = 2

_guard_enabled = False


def now() -> datetime:
    """Injectable clock: tests monkeypatch this to move time forward."""
    return datetime.now(timezone.utc)


def _template() -> RunStatus:
    return RunStatus.model_validate_json(config.RECORDED_RUN_PATH.read_text())


def start_run(req: StartRunRequest) -> StartRunResponse:
    """Raises FileNotFoundError for an unknown policy."""
    load_policy(req.policy_id)
    run_id = trace_store.next_run_id()
    trace_store.save_run(
        RunStatus(
            run_id=run_id,
            policy_id=req.policy_id,
            target_url=req.target_url,
            status="running",
            created_at=trace_store.iso(now()),
        )
    )
    return StartRunResponse(run_id=run_id)


def get_run(run_id: str) -> RunStatus | None:
    run = trace_store.load_run(run_id)
    if run is None or run.status != "running":
        return run

    template = _template()
    total = len(template.attacks)
    created_at_dt = datetime.fromisoformat(run.created_at) if isinstance(run.created_at, str) else run.created_at
    shown = min(total, int((now() - created_at_dt).total_seconds() // REVEAL_SECONDS))
    run.attacks = [
        a.model_copy(
            update={
                "run_id": run_id,
                "timestamp": trace_store.iso(created_at_dt + timedelta(seconds=REVEAL_SECONDS * (i + 1))),
                "trace_id": trace_store.make_trace_id(run.policy_id, a.prompt, run.target_url),
            }
        )
        for i, a in enumerate(template.attacks[:shown])
    ]
    if shown == total:
        run.status = "done"
        run.gate = template.gate
        run.completed_at = trace_store.iso(created_at_dt + timedelta(seconds=REVEAL_SECONDS * total))
        run.regression_tests = template.regression_tests
    trace_store.save_run(run)
    return run


def regress(run_id: str) -> RegressionRun:
    """Every regression test passes, so the gate flips to GREEN.

    Raises KeyError for an unknown run and RuntimeError if the run is not done yet.
    """
    run = get_run(run_id)
    if run is None:
        raise KeyError(f"Unknown run: {run_id}")
    if run.status != "done":
        raise RuntimeError(f"Run {run_id} is still {run.status}")
    rr = RegressionRun(
        ran_at=trace_store.iso(now()),
        gate="GREEN",
        results=[RegressionResult(test_id=t.test_id, passed=True) for t in run.regression_tests],
    )
    trace_store.add_regression_run(run_id, rr)
    return rr


def set_guard(req: GuardRequest) -> GuardResponse:
    """Echo only; forwarding to the target agent's /admin/guard is Sprint 2."""
    global _guard_enabled
    _guard_enabled = req.enabled
    return GuardResponse(enabled=_guard_enabled)
