import pytest
from conftest import make_attack
from fastapi.testclient import TestClient

from gauntlet.api.main import app
from gauntlet.core import finalize
from gauntlet.core.issues import build_issue_report
from gauntlet.core.policy import load_policy
from gauntlet.pipeline import trace_store
from gauntlet.shared.schemas import RegressionResult, RegressionRun, RegressionTest, RunStatus

RUN_ID = "run_20260927_001"


def _test(test_id: str, attack_id: str) -> RegressionTest:
    return RegressionTest(test_id=test_id, source_attack_id=attack_id, code="", assertion="")


def _run(attacks, tests=(), regression_runs=()) -> RunStatus:
    return RunStatus(
        run_id=RUN_ID, policy_id="customer_support", target_url="http://t", status="done", gate="RED",
        created_at="2026-09-27T09:00:00Z", attacks=list(attacks), regression_tests=list(tests),
        regression_runs=list(regression_runs),
    )


@pytest.fixture
def policy():
    return load_policy("customer_support")


def test_groups_by_tool_and_attack_type(policy):
    run = _run([
        make_attack(1, confidence=0.9),
        make_attack(2, confidence=0.7),
        make_attack(3, attack_type="unauthorized_tool_action", confidence=0.8),
        make_attack(4, tool_calls=["access_pii(12)"], violated_rule="forbidden_actions[1]", confidence=0.95),
        make_attack(5, succeeded=False),
    ])
    report = build_issue_report(run, policy)
    assert (report.total_attacks, report.total_failures) == (5, 4)
    keys = [(g.violated_tool, g.attack_type, g.occurrences) for g in report.groups]
    # delete_record×2: 4*2*0.9=7.2; access_pii: 3*1*0.95=2.85; delete_record uta: 4*1*0.8=3.2
    assert keys == [
        ("delete_record", "prompt_injection", 2),
        ("delete_record", "unauthorized_tool_action", 1),
        ("access_pii", "prompt_injection", 1),
    ]
    top = report.groups[0]
    assert (top.issue_id, top.severity, top.score, top.max_confidence) == ("iss_001", "critical", 7.2, 0.9)
    assert top.attack_ids == ["atk_001", "atk_002"]
    assert len(top.trace_ids) == 2
    assert report.groups[2].severity == "high"
    assert [g.issue_id for g in report.groups] == ["iss_001", "iss_002", "iss_003"]


def test_example_prompt_is_highest_confidence_and_truncated(policy):
    run = _run([make_attack(1, prompt="low", confidence=0.5), make_attack(2, prompt="x" * 500, confidence=0.99)])
    group = build_issue_report(run, policy).groups[0]
    assert group.example_prompt == "x" * 200


def test_rule_judge_fallback_and_unknown_violation(policy):
    run = _run([
        make_attack(1, tool_calls=["access_pii(3)"], violated_rule=None),
        make_attack(2, tool_calls=[], violated_rule="max_response_length"),
    ])
    groups = {g.violated_tool: g for g in build_issue_report(run, policy).groups}
    assert groups["access_pii"].severity == "high"
    assert groups["max_response_length"].severity == "medium"


def test_fixed_states(policy):
    attacks = [make_attack(1), make_attack(2, tool_calls=["access_pii(1)"], violated_rule="forbidden_actions[1]")]
    tests = [_test("reg_001", "atk_001"), _test("reg_002", "atk_002")]
    assert all(g.fixed is None for g in build_issue_report(_run(attacks, tests), policy).groups)

    rr_old = RegressionRun(ran_at="t1", gate="RED", results=[RegressionResult(test_id="reg_001", passed=False),
                                                              RegressionResult(test_id="reg_002", passed=False)])
    rr_new = RegressionRun(ran_at="t2", gate="RED", results=[RegressionResult(test_id="reg_001", passed=True),
                                                              RegressionResult(test_id="reg_002", passed=False)])
    groups = {g.violated_tool: g for g in build_issue_report(_run(attacks, tests, [rr_old, rr_new]), policy).groups}
    assert groups["delete_record"].fixed is True  # latest run wins
    assert groups["access_pii"].fixed is False
    assert groups["delete_record"].regression_test_ids == ["reg_001"]


def test_group_without_tests_is_not_fixed(policy):
    rr = RegressionRun(ran_at="t", gate="GREEN", results=[])
    assert build_issue_report(_run([make_attack(1)], [], [rr]), policy).groups[0].fixed is False


@pytest.fixture
def live_client(monkeypatch):
    monkeypatch.setenv("API_MODE", "live")
    return TestClient(app)


def test_issues_route_live(live_client):
    trace_store.save_run(_run([make_attack(1)]))
    report = live_client.get(f"/api/run/{RUN_ID}/issues").json()
    assert report["run_id"] == RUN_ID
    assert report["groups"][0]["violated_tool"] == "delete_record"


def test_issues_route_409_before_done(live_client):
    run_id = finalize.start_run("customer_support", "http://t")
    assert live_client.get(f"/api/run/{run_id}/issues").status_code == 409


def test_issues_route_404(live_client):
    assert live_client.get("/api/run/run_20000101_001/issues").status_code == 404


def test_issues_route_mock(monkeypatch):
    from datetime import timedelta

    from test_api import Clock

    from gauntlet.api import mock

    clock = Clock()
    monkeypatch.setattr(mock, "now", clock)
    monkeypatch.setenv("API_MODE", "mock")
    client = TestClient(app)
    run_id = client.post("/api/run", json={"policy_id": "customer_support", "target_url": "http://t"}).json()["run_id"]
    assert client.get(f"/api/run/{run_id}/issues").status_code == 409
    clock.t += timedelta(seconds=60)
    report = client.get(f"/api/run/{run_id}/issues").json()
    assert report["total_failures"] >= 1
    assert report["groups"][0]["severity"] == "critical"
