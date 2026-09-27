from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from gauntlet.api import mock
from gauntlet.api.main import app
from gauntlet.shared import config

START = datetime(2026, 9, 27, 9, 0, tzinfo=timezone.utc)
BODY = {"policy_id": "customer_support", "target_url": "http://localhost:8001"}


class Clock:
    def __init__(self):
        self.t = START

    def __call__(self):
        return self.t

    def advance(self, seconds: float):
        self.t += timedelta(seconds=seconds)


@pytest.fixture
def clock(monkeypatch):
    c = Clock()
    monkeypatch.setattr(mock, "now", c)
    return c


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(config, "API_MODE", "mock")
    return TestClient(app)


def test_health(client):
    assert client.get("/api/health").json() == {"ok": True, "mode": "mock"}


def test_policies(client):
    assert client.get("/api/policies").json() == ["customer_support"]


def test_run_progresses_then_regress_goes_green(client, clock):
    run_id = client.post("/api/run", json=BODY).json()["run_id"]

    clock.advance(3)
    run = client.get(f"/api/run/{run_id}").json()
    assert run["status"] == "running"
    assert run["gate"] is None
    assert 0 < len(run["attacks"]) < 4
    assert run["regression_tests"] == []
    assert client.post(f"/api/run/{run_id}/regress").status_code == 409

    clock.advance(10)
    run = client.get(f"/api/run/{run_id}").json()
    assert run["status"] == "done"
    assert run["gate"] == "RED"
    assert len(run["attacks"]) == 4
    assert all(a["run_id"] == run_id for a in run["attacks"])
    assert run["completed_at"] is not None
    assert len(run["regression_tests"]) == 1

    rr = client.post(f"/api/run/{run_id}/regress").json()
    assert rr["gate"] == "GREEN"
    assert all(r["passed"] for r in rr["results"])
    assert client.get(f"/api/run/{run_id}").json()["gate"] == "GREEN"


def test_unknown_run_404(client):
    assert client.get("/api/run/run_20000101_001").status_code == 404
    assert client.post("/api/run/run_20000101_001/regress").status_code == 404


def test_unknown_policy_404(client):
    assert client.post("/api/run", json={**BODY, "policy_id": "nope"}).status_code == 404


def test_guard_echo(client):
    assert client.post("/api/target/guard", json={"enabled": True}).json() == {"enabled": True}


def test_live_mode_returns_501(client, monkeypatch):
    monkeypatch.setattr(config, "API_MODE", "live")
    assert client.post("/api/run", json=BODY).status_code == 501
    assert client.get("/api/policies").status_code == 200


def test_cors_header(client):
    resp = client.get("/api/health", headers={"Origin": "http://localhost:3000"})
    assert resp.headers["access-control-allow-origin"] == "http://localhost:3000"
