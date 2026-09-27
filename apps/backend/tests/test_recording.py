import json

from test_demo_check import FakeApi, _main

from gauntlet.shared import config
from gauntlet.shared.schemas import RunStatus


def test_saves_fastest_passing_run():
    previous = config.RECORDED_RUN_PATH.read_text()
    api = FakeApi(polls=(3, 1, 2))
    code, output = _main(api, "--runs", "3", "--save-recording")
    assert code == 0
    assert "Recorded run saved (run_" in output
    assert "FE1: copy data/recorded_run/run.json to the frontend mocks." in output

    fastest = [r for r in map(json.loads, (config.DATA_DIR / "demo_checks.jsonl").read_text().splitlines()) if r["run"] == 2][0]
    saved = RunStatus.model_validate_json(config.RECORDED_RUN_PATH.read_text())
    assert saved.run_id == fastest["run_id"]
    assert (saved.status, saved.gate, saved.regression_runs) == ("done", "RED", [])
    assert len(saved.regression_tests) == 1
    assert (config.RECORDED_RUN_PATH.with_name("run.prev.json")).read_text() == previous


def test_no_passing_run_writes_nothing():
    previous = config.RECORDED_RUN_PATH.read_text()
    api = FakeApi(polls=(1, 1), gate_after="RED")
    code, output = _main(api, "--runs", "2", "--save-recording")
    assert code == 1
    assert "No passing run; recorded run left unchanged." in output
    assert config.RECORDED_RUN_PATH.read_text() == previous
    assert not config.RECORDED_RUN_PATH.with_name("run.prev.json").exists()


def test_mock_mode_works_with_saved_template(monkeypatch):
    """The saved recording drives mock mode end to end."""
    from datetime import timedelta

    from fastapi.testclient import TestClient
    from test_api import Clock

    from gauntlet.api import mock
    from gauntlet.api.main import app

    _main(FakeApi(polls=(1,)), "--runs", "1", "--save-recording")
    template = RunStatus.model_validate_json(config.RECORDED_RUN_PATH.read_text())

    clock = Clock()
    monkeypatch.setattr(mock, "now", clock)
    monkeypatch.setenv("API_MODE", "mock")
    client = TestClient(app)
    run_id = client.post("/api/run", json={"policy_id": "customer_support", "target_url": "http://localhost:8001"}).json()["run_id"]
    clock.t += timedelta(seconds=mock.REVEAL_SECONDS * len(template.attacks) + 1)
    run = client.get(f"/api/run/{run_id}").json()
    assert (run["status"], run["gate"], len(run["attacks"])) == ("done", "RED", len(template.attacks))
    assert client.post(f"/api/run/{run_id}/regress").json()["gate"] == "GREEN"
