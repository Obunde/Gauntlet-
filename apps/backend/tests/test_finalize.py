from conftest import fake_pipeline

from gauntlet.core import finalize
from gauntlet.pipeline import trace_store

TARGET = "http://localhost:8001"


def _execute(**kwargs):
    run_id = finalize.start_run("customer_support", TARGET)
    assert trace_store.load_run(run_id).status == "pending"
    finalize.execute_run(run_id, "customer_support", TARGET)
    return trace_store.load_run(run_id)


def test_done_red_with_regression_test(install_pipeline):
    install_pipeline(fake_pipeline(succeeded=1, blocked=2))
    run = _execute()
    assert run.status == "done"
    assert run.gate == "RED"
    assert len(run.attacks) == 3
    assert [t.source_attack_id for t in run.regression_tests] == ["atk_001"]
    assert run.completed_at is not None
    assert run.error is None


def test_all_blocked_is_green(install_pipeline):
    install_pipeline(fake_pipeline(succeeded=0, blocked=3))
    run = _execute()
    assert (run.status, run.gate, run.regression_tests) == ("done", "GREEN", [])


def test_zero_attacks_is_error(install_pipeline):
    install_pipeline(fake_pipeline(succeeded=0, blocked=0))
    run = _execute()
    assert (run.status, run.error, run.gate) == ("error", "no attacks were executed", None)


def test_pipeline_exception_is_error(install_pipeline):
    def boom(run_id, policy_id, target_url):
        raise RuntimeError("target unreachable")

    install_pipeline(boom)
    run = _execute()
    assert (run.status, run.error) == ("error", "target unreachable")
    assert run.completed_at is not None


def test_missing_orchestrator(install_pipeline):
    install_pipeline(None)
    assert finalize.pipeline_ready() is False
    assert _execute().error == finalize.PIPELINE_MISSING


def test_stubbed_orchestrator(install_pipeline):
    def stub(run_id, policy_id, target_url):
        raise NotImplementedError("TODO BE1 sprint 2")

    install_pipeline(stub)
    run = _execute()
    assert (run.status, run.error) == ("error", finalize.PIPELINE_MISSING)
