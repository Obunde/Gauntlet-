from gauntlet.pipeline.trace_store import make_trace_id
from gauntlet.shared import config
from gauntlet.shared.schemas import RunStatus


def test_recorded_run_validates():
    run = RunStatus.model_validate_json(config.RECORDED_RUN_PATH.read_text())
    assert run.status == "done"
    assert run.gate == "RED"
    assert len(run.attacks) == 4
    assert [a.judge.succeeded for a in run.attacks].count(True) == 1
    assert len(run.regression_tests) == 1
    assert run.regression_runs == []


def test_recorded_run_trace_ids_are_deterministic():
    run = RunStatus.model_validate_json(config.RECORDED_RUN_PATH.read_text())
    for a in run.attacks:
        assert a.trace_id == make_trace_id(run.policy_id, a.prompt, run.target_url)
