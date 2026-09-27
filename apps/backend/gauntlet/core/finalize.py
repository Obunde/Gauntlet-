"""Live-mode run lifecycle: pending -> running -> done | error. Owner: BE2.

BE1's run_pipeline only persists attacks (trace_store.add_attack). BE2 owns everything around
it: creating the run, the gate, regression tests, and the final status.
"""
import logging
from datetime import datetime, timezone

from gauntlet.core.gate import decide
from gauntlet.core.policy import load_policy
from gauntlet.core.regression import generate
from gauntlet.pipeline import trace_store
from gauntlet.shared.schemas import RunStatus

log = logging.getLogger(__name__)

PIPELINE_MISSING = "pipeline not available yet (BE1)"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _load(run_id: str) -> RunStatus:
    run = trace_store.load_run(run_id)
    if run is None:
        raise KeyError(f"Unknown run: {run_id}")
    return run


def pipeline_ready() -> bool:
    """True if BE1's run_pipeline can be imported (it may still be a NotImplementedError stub)."""
    try:
        from gauntlet.pipeline.orchestrator import run_pipeline
    except ImportError:
        return False
    return callable(run_pipeline)


def start_run(policy_id: str, target_url: str) -> str:
    """Create a pending run. Raises FileNotFoundError for an unknown policy."""
    load_policy(policy_id)
    run_id = trace_store.next_run_id()
    trace_store.save_run(
        RunStatus(run_id=run_id, policy_id=policy_id, target_url=target_url, status="pending", created_at=_now())
    )
    return run_id


def finalize_run(run_id: str) -> None:
    """Set the gate, generate regression tests for successful attacks, and mark the run done."""
    run = _load(run_id)
    run.completed_at = _now()
    if not run.attacks:
        run.status, run.error, run.gate = "error", "no attacks were executed", None
        trace_store.save_run(run)
        return

    policy = load_policy(run.policy_id)
    tests, errors = [], []
    for attack in run.attacks:
        if not attack.judge.succeeded:
            continue
        try:
            tests.append(generate(attack, policy, run_id))
        except Exception as exc:  # noqa: BLE001 - one bad attack must not lose the others
            log.warning("Regression generation failed for %s/%s: %s", run_id, attack.attack_id, exc)
            errors.append(f"{attack.attack_id}: {exc}")

    run.gate = decide(run.attacks)
    run.regression_tests = tests
    run.error = "regression generation failed for " + "; ".join(errors) if errors else None
    run.status = "done"
    trace_store.save_run(run)


def fail_run(run_id: str, message: str) -> None:
    run = _load(run_id)
    run.status, run.error, run.completed_at = "error", message, _now()
    trace_store.save_run(run)


def execute_run(run_id: str, policy_id: str, target_url: str) -> None:
    """Background task for POST /api/run in live mode. Never raises."""
    try:
        run = _load(run_id)
        run.status = "running"
        trace_store.save_run(run)

        try:
            from gauntlet.pipeline.orchestrator import run_pipeline
        except ImportError as exc:
            log.warning("Run %s: orchestrator not importable (%s)", run_id, exc)
            fail_run(run_id, PIPELINE_MISSING)
            return

        try:
            run_pipeline(run_id, policy_id, target_url)
        except NotImplementedError:
            fail_run(run_id, PIPELINE_MISSING)
            return
        finalize_run(run_id)
    except Exception as exc:  # noqa: BLE001 - a background task has nobody to raise to
        log.exception("Run %s failed", run_id)
        try:
            fail_run(run_id, str(exc) or type(exc).__name__)
        except Exception:  # noqa: BLE001
            log.exception("Run %s: could not record the failure", run_id)
