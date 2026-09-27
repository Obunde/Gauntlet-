import json

import pytest
from conftest import make_attack
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from gauntlet.core import regression
from gauntlet.core.policy import load_policy
from gauntlet.pipeline import trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import RegressionResult, RegressionRun, RunStatus
from gauntlet.tools import demo_check


class FakeClock:
    """Injected as both clock and sleep, so polling advances time without waiting."""

    def __init__(self):
        self.t = 0.0

    def __call__(self) -> float:
        return self.t

    def sleep(self, seconds: float) -> None:
        self.t += seconds


class FakeApi:
    """Stand-in for the live Gauntlet API (API_MODE=live with BE1's pipeline)."""

    def __init__(self, polls=(2, 2, 2), gate_before="RED", gate_after="GREEN", ready=True, mode="live",
                 run_error=None, regress_status=200):
        self.polls = list(polls)  # polls until done, per run
        self.gate_before, self.gate_after = gate_before, gate_after
        self.ready, self.mode, self.run_error, self.regress_status = ready, mode, run_error, regress_status
        self.guard_calls: list[bool] = []
        self._remaining: dict[str, int] = {}
        self.app = self._build()

    def _finish(self, run: RunStatus) -> None:
        if self.run_error:
            run.status, run.error = "error", self.run_error
        else:
            succeeded = self.gate_before == "RED"
            run.attacks = [make_attack(1, run_id=run.run_id, succeeded=succeeded), make_attack(2, run_id=run.run_id, succeeded=False)]
            run.gate = self.gate_before
            policy = load_policy(run.policy_id)
            run.regression_tests = [regression.generate(a, policy, run.run_id) for a in run.attacks if a.judge.succeeded]
            run.status = "done"
        trace_store.save_run(run)

    def _build(self) -> FastAPI:
        app = FastAPI()

        @app.get("/api/health")
        def health():
            return {"ok": True, "mode": self.mode, "pipeline_ready": self.ready}

        @app.post("/api/target/guard")
        def guard(body: dict):
            self.guard_calls.append(body["enabled"])
            return {"enabled": body["enabled"]}

        @app.post("/api/run")
        def start(body: dict):
            run_id = trace_store.next_run_id()
            trace_store.save_run(RunStatus(run_id=run_id, policy_id=body["policy_id"], target_url=body["target_url"],
                                           status="running", created_at="2026-09-27T09:00:00Z"))
            self._remaining[run_id] = self.polls.pop(0)
            return {"run_id": run_id}

        @app.get("/api/run/{run_id}")
        def get(run_id: str):
            run = trace_store.load_run(run_id)
            if run.status == "running":
                self._remaining[run_id] -= 1
                if self._remaining[run_id] <= 0:
                    self._finish(run)
            return trace_store.load_run(run_id).model_dump()

        @app.post("/api/run/{run_id}/regress")
        def regress(run_id: str):
            if self.regress_status != 200:
                raise HTTPException(self.regress_status, "regress exploded")
            run = trace_store.load_run(run_id)
            ok = self.gate_after == "GREEN"
            rr = RegressionRun(ran_at="2026-09-27T09:01:00Z", gate=self.gate_after,
                               results=[RegressionResult(test_id=t.test_id, passed=ok) for t in run.regression_tests])
            trace_store.add_regression_run(run_id, rr)
            return rr.model_dump()

        return app


def _main(api: FakeApi, *args: str):
    clock, lines = FakeClock(), []
    code = demo_check.main(list(args), client=TestClient(api.app), out=lines.append, sleep=clock.sleep, clock=clock)
    return code, "\n".join(lines)


def _log() -> list[dict]:
    path = config.DATA_DIR / "demo_checks.jsonl"
    return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []


def test_all_pass(tmp_path):
    api = FakeApi()
    code, output = _main(api, "--runs", "3")
    assert code == 0
    assert "3/3 passed — avg run 1 s, avg regress 0.0 s" in output  # 2 polls = 1 sleep
    assert output.count("PASS") == 3
    log = _log()
    assert [r["passed"] for r in log] == [True, True, True]
    assert all(r["attacks"] == 2 and r["run_seconds"] == 1 and r["sec_per_attack"] == 0.5 for r in log)
    # per run: reset, fix, final reset
    assert api.guard_calls == [False, True, False] * 3


def test_red_never_happens():
    api = FakeApi(polls=(1,), gate_before="GREEN")
    code, output = _main(api, "--runs", "1")
    assert code == 1
    assert "expected gate RED before the fix, got GREEN" in output
    assert _log()[0]["reason"] == "expected gate RED before the fix, got GREEN"
    assert api.guard_calls == [False, False]  # never applied the fix; still reset


def test_green_never_happens():
    api = FakeApi(polls=(1,), gate_after="RED")
    code, output = _main(api, "--runs", "1")
    assert code == 1
    assert "expected GREEN after the fix, got RED (failed: reg_001)" in output
    assert api.guard_calls == [False, True, False]


def test_guard_reset_when_regress_errors():
    api = FakeApi(polls=(1,), regress_status=500)
    code, output = _main(api, "--runs", "1")
    assert code == 1
    assert "regress: HTTP 500 regress exploded" in output
    assert api.guard_calls[-1] is False


def test_run_error_reported():
    api = FakeApi(polls=(1,), run_error="pipeline not available yet (BE1)")
    code, output = _main(api, "--runs", "1")
    assert code == 1
    assert "run ended in error: pipeline not available yet (BE1)" in output


def test_timeout(monkeypatch):
    api = FakeApi(polls=(1000,))
    code, output = _main(api, "--runs", "1", "--timeout", "5")
    assert code == 1
    assert "run still running after 5 s" in output
    assert api.guard_calls[-1] is False


def test_missing_regression_file():
    api = FakeApi(polls=(1,))
    original = api._finish

    def finish_then_delete(run):
        original(run)
        for p in regression.run_tests_dir(run.run_id).glob("*.py"):
            p.unlink()

    api._finish = finish_then_delete
    code, output = _main(api, "--runs", "1")
    assert code == 1
    assert "regression test files missing on disk: reg_001" in output


@pytest.mark.parametrize(
    "kwargs, message",
    [({"ready": False}, "BE1 pipeline not ready"), ({"mode": "mock"}, "API not in live mode")],
)
def test_health_not_ready_aborts_cleanly(kwargs, message):
    api = FakeApi(**kwargs)
    code, output = _main(api, "--runs", "3")
    assert code == 2
    assert f"Demo check aborted: {message}" in output
    assert "Traceback" not in output
    assert _log() == []


def test_api_unreachable_aborts_cleanly():
    lines = []
    code = demo_check.main(["--api", "http://127.0.0.1:9", "--runs", "1"], out=lines.append)
    assert code == 2
    assert "API not reachable" in lines[-1]
