import re
from datetime import datetime, timezone

from gauntlet.pipeline import trace_store
from gauntlet.shared.schemas import AttackRecord, JudgeVerdict, RegressionRun, RunStatus

NOW = datetime(2026, 9, 27, 9, 0, tzinfo=timezone.utc)


def _run(run_id: str) -> RunStatus:
    return RunStatus(
        run_id=run_id, policy_id="customer_support", target_url="http://localhost:8001",
        status="running", created_at=NOW,
    )


def test_save_load_round_trip():
    run = _run(trace_store.next_run_id())
    trace_store.save_run(run)
    assert trace_store.load_run(run.run_id) == run
    assert trace_store.list_runs() == [run.run_id]


def test_load_unknown_or_invalid_returns_none():
    assert trace_store.load_run("run_20000101_001") is None
    assert trace_store.load_run("../../etc") is None


def test_next_run_id_increments():
    first, second = trace_store.next_run_id(), trace_store.next_run_id()
    assert re.fullmatch(r"run_\d{8}_001", first)
    assert second == first[:-3] + "002"


def test_make_trace_id_is_deterministic():
    a = trace_store.make_trace_id("customer_support", "hi", "http://localhost:8001")
    assert a == trace_store.make_trace_id("customer_support", "hi", "http://localhost:8001")
    assert a != trace_store.make_trace_id("customer_support", "hi!", "http://localhost:8001")
    assert re.fullmatch(r"trc_[0-9a-f]{12}", a)


def test_add_attack():
    run = _run(trace_store.next_run_id())
    trace_store.save_run(run)
    rec = AttackRecord(
        attack_id="atk_001", run_id=run.run_id, timestamp=NOW, attack_type="prompt_injection",
        prompt="p", target_response="r", tool_calls=[],
        judge=JudgeVerdict(succeeded=False, confidence=0.1, reasoning="blocked"),
        trace_id="trc_000000000000",
    )
    trace_store.add_attack(run.run_id, rec)
    assert trace_store.load_run(run.run_id).attacks == [rec]


def test_add_regression_run_updates_gate():
    run = _run(trace_store.next_run_id())
    run.gate = "RED"
    trace_store.save_run(run)
    trace_store.add_regression_run(run.run_id, RegressionRun(ran_at=NOW, gate="GREEN", results=[]))
    stored = trace_store.load_run(run.run_id)
    assert stored.gate == "GREEN"
    assert len(stored.regression_runs) == 1
