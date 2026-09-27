import pytest
from conftest import fake_pipeline
from fastapi.testclient import TestClient

from gauntlet.api.main import app
from gauntlet.core import finalize


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("API_MODE", "live")
    return TestClient(app)


def _start(client, target_url: str) -> str:
    resp = client.post("/api/run", json={"policy_id": "customer_support", "target_url": target_url})
    assert resp.status_code == 200
    return resp.json()["run_id"]


def _wait_done(client, run_id: str) -> dict:
    # TestClient runs background tasks before returning, but poll like the dashboard does.
    for _ in range(50):
        run = client.get(f"/api/run/{run_id}").json()
        if run["status"] in ("done", "error"):
            return run
    raise AssertionError(f"run did not finish: {run}")


def test_health_reports_pipeline(client, install_pipeline):
    install_pipeline(None)
    assert client.get("/api/health").json() == {"ok": True, "mode": "live", "pipeline_ready": False}
    install_pipeline(fake_pipeline())
    assert client.get("/api/health").json()["pipeline_ready"] is True


def test_run_red_then_regress_green(client, install_pipeline, fake_target):
    install_pipeline(fake_pipeline(succeeded=1, blocked=2))
    run_id = _start(client, fake_target.url)
    run = _wait_done(client, run_id)
    assert (run["status"], run["gate"], len(run["attacks"]), len(run["regression_tests"])) == ("done", "RED", 3, 1)

    rr = client.post(f"/api/run/{run_id}/regress").json()
    assert rr["gate"] == "RED"

    fake_target.hardened = True
    rr = client.post(f"/api/run/{run_id}/regress").json()
    assert rr["gate"] == "GREEN"
    assert rr["results"] == [{"test_id": "reg_001", "passed": True}]
    run = client.get(f"/api/run/{run_id}").json()
    assert run["gate"] == "GREEN"
    assert len(run["regression_runs"]) == 2


def test_missing_pipeline_ends_in_error(client, install_pipeline):
    install_pipeline(None)
    run = _wait_done(client, _start(client, "http://localhost:8001"))
    assert (run["status"], run["error"]) == ("error", finalize.PIPELINE_MISSING)


def test_regress_before_done_is_409(client):
    run_id = finalize.start_run("customer_support", "http://localhost:8001")  # pending, no task
    assert client.post(f"/api/run/{run_id}/regress").status_code == 409


def test_regress_without_tests_is_409(client, install_pipeline):
    install_pipeline(fake_pipeline(succeeded=0, blocked=2))
    run_id = _start(client, "http://localhost:8001")
    assert _wait_done(client, run_id)["gate"] == "GREEN"
    assert client.post(f"/api/run/{run_id}/regress").status_code == 409


def test_unknown_run_and_policy_404(client):
    assert client.get("/api/run/run_20000101_001").status_code == 404
    assert client.post("/api/run/run_20000101_001/regress").status_code == 404
    assert client.post("/api/run", json={"policy_id": "nope", "target_url": "x"}).status_code == 404


def test_guard_forwards_to_target(client, fake_target, monkeypatch):
    monkeypatch.setenv("TARGET_URL", fake_target.url)
    assert client.post("/api/target/guard", json={"enabled": True}).json() == {"enabled": True}
    assert fake_target.hardened is True


def test_guard_unreachable_target_is_502(client, unreachable_url, monkeypatch):
    monkeypatch.setenv("TARGET_URL", unreachable_url)
    resp = client.post("/api/target/guard", json={"enabled": True})
    assert resp.status_code == 502


def test_target_url_defaults_to_config(client, install_pipeline, monkeypatch):
    monkeypatch.setenv("TARGET_URL", "http://agent.example:8001")
    install_pipeline(fake_pipeline(succeeded=0, blocked=1))
    run_id = client.post("/api/run", json={"policy_id": "customer_support"}).json()["run_id"]
    assert _wait_done(client, run_id)["target_url"] == "http://agent.example:8001"
