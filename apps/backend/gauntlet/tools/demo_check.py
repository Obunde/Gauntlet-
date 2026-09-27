"""Pre-demo check: drive the live API over HTTP exactly as the dashboard does. Owner: BE2.

Per run: reset the target to vulnerable -> start a run -> expect RED with regression tests ->
turn the guard on (the fix) -> regress -> expect GREEN -> always reset the guard.

    python -m gauntlet.tools.demo_check --runs 3 [--save-recording]

Timings are appended to data/demo_checks.jsonl. Exit code 0 only if every run passed.
With --save-recording, the fastest passing run becomes data/recorded_run/run.json.
"""
import argparse
import json
import shutil
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import httpx

from gauntlet.core.gate import decide
from gauntlet.core.regression import run_tests_dir
from gauntlet.pipeline import trace_store
from gauntlet.shared import config
from gauntlet.shared.schemas import RunStatus

POLL_SECONDS = 1.0


class CheckAborted(Exception):
    """The environment is not ready for a demo; no point running further checks."""


class StepFailed(Exception):
    """One run did not behave as the demo needs."""


@dataclass
class RunResult:
    run: int
    run_id: str | None = None
    passed: bool = False
    reason: str | None = None
    run_seconds: float | None = None
    attacks: int = 0
    sec_per_attack: float | None = None
    regress_seconds: float | None = None


def log_path() -> Path:
    return config.DATA_DIR / "demo_checks.jsonl"


def _json(resp: httpx.Response, step: str):
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("detail", resp.text)
        except ValueError:
            detail = resp.text
        raise StepFailed(f"{step}: HTTP {resp.status_code} {detail}"[:300])
    return resp.json()


def check_health(client: httpx.Client) -> None:
    try:
        health = client.get("/api/health").json()
    except (httpx.HTTPError, ValueError) as exc:
        raise CheckAborted(f"API not reachable at {client.base_url}: {exc}") from exc
    if health.get("mode") != "live":
        raise CheckAborted(f"API not in live mode (mode={health.get('mode')!r}); start it with `make api-live`")
    if not health.get("pipeline_ready"):
        raise CheckAborted("BE1 pipeline not ready (gauntlet.pipeline.orchestrator.run_pipeline not importable)")


def _set_guard(client: httpx.Client, enabled: bool) -> None:
    _json(client.post("/api/target/guard", json={"enabled": enabled}), f"guard enabled={enabled}")


def check_once(
    client: httpx.Client,
    n: int,
    policy: str,
    target: str,
    timeout: float,
    sleep: Callable[[float], None] = time.sleep,
    clock: Callable[[], float] = time.monotonic,
) -> RunResult:
    result = RunResult(run=n)
    try:
        check_health(client)
        _set_guard(client, False)

        started = clock()
        result.run_id = _json(client.post("/api/run", json={"policy_id": policy, "target_url": target}), "start run")["run_id"]
        while True:
            run = _json(client.get(f"/api/run/{result.run_id}"), "poll run")
            if run["status"] in ("done", "error"):
                break
            if clock() - started > timeout:
                raise StepFailed(f"run still {run['status']} after {timeout:.0f} s")
            sleep(POLL_SECONDS)
        result.run_seconds = round(clock() - started, 2)
        result.attacks = len(run["attacks"])
        if result.attacks:
            result.sec_per_attack = round(result.run_seconds / result.attacks, 2)

        if run["status"] != "done":
            raise StepFailed(f"run ended in error: {run.get('error')}")
        if run["gate"] != "RED":
            raise StepFailed(f"expected gate RED before the fix, got {run['gate']}")
        if not any(a["judge"]["succeeded"] for a in run["attacks"]):
            raise StepFailed("no attack succeeded against the vulnerable target")
        if not run["regression_tests"]:
            raise StepFailed("no regression tests were generated")
        missing = [
            t["test_id"] for t in run["regression_tests"]
            if not (run_tests_dir(result.run_id) / f"test_{t['test_id']}.py").is_file()
        ]
        if missing:
            raise StepFailed(f"regression test files missing on disk: {', '.join(missing)}")

        _set_guard(client, True)
        started = clock()
        rr = _json(client.post(f"/api/run/{result.run_id}/regress"), "regress")
        result.regress_seconds = round(clock() - started, 2)
        failed = [r["test_id"] for r in rr["results"] if not r["passed"]]
        if rr["gate"] != "GREEN" or failed or not rr["results"]:
            raise StepFailed(f"expected GREEN after the fix, got {rr['gate']} (failed: {', '.join(failed) or 'none'})")
        final_gate = _json(client.get(f"/api/run/{result.run_id}"), "reload run")["gate"]
        if final_gate != "GREEN":
            raise StepFailed(f"run's top-level gate is {final_gate} after regress, expected GREEN")
        result.passed = True
    except CheckAborted:
        raise
    except StepFailed as exc:
        result.reason = str(exc)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        result.reason = f"{type(exc).__name__}: {exc}"[:300]
    finally:
        try:
            _set_guard(client, False)
        except (StepFailed, httpx.HTTPError) as exc:
            if result.passed:
                result.passed = False
                result.reason = f"could not reset guard: {exc}"
    return result


def _fmt(value, unit: str = "") -> str:
    return "–" if value is None else f"{value}{unit}"


def print_result(r: RunResult, out: Callable[[str], None] = print) -> None:
    out(f"\nRun {r.run}: {'PASS' if r.passed else 'FAIL'}  {r.run_id or ''}")
    for label, value in [
        ("run duration", _fmt(r.run_seconds, " s")),
        ("attacks", str(r.attacks)),
        ("avg per attack", _fmt(r.sec_per_attack, " s")),
        ("regress duration", _fmt(r.regress_seconds, " s")),
    ]:
        out(f"  {label:<17} {value}")
    if r.reason:
        out(f"  {'reason':<17} {r.reason}")


def summary(results: list[RunResult]) -> str:
    passed = [r for r in results if r.passed]
    line = f"{len(passed)}/{len(results)} passed"
    if passed:
        avg_run = sum(r.run_seconds for r in passed) / len(passed)
        avg_regress = sum(r.regress_seconds for r in passed) / len(passed)
        line += f" — avg run {avg_run:.0f} s, avg regress {avg_regress:.1f} s"
    return line


def append_log(results: list[RunResult], meta: dict, path: Path | None = None) -> None:
    path = path or log_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    now = trace_store.iso(datetime.now(timezone.utc))
    with path.open("a") as f:
        for r in results:
            f.write(json.dumps({"time": now, **meta, **asdict(r)}) + "\n")


def save_recording(results: list[RunResult], out: Callable[[str], None] = print) -> Path | None:
    """Write the fastest passing run, as it was right after finalize, to the mock/replay template."""
    passed = [r for r in results if r.passed]
    if not passed:
        out("No passing run; recorded run left unchanged.")
        return None
    best = min(passed, key=lambda r: r.run_seconds)
    run = trace_store.load_run(best.run_id)
    if run is None:
        out(f"Run {best.run_id} not found in {config.RUNS_DIR}; recorded run left unchanged.")
        return None

    snapshot = RunStatus.model_validate(
        run.model_dump() | {"status": "done", "gate": decide(run.attacks), "regression_runs": []}
    )
    target = config.RECORDED_RUN_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_file():
        shutil.copyfile(target, target.with_name("run.prev.json"))
    target.write_text(snapshot.model_dump_json(indent=2) + "\n")
    out(f"Recorded run saved ({best.run_id}) — FE1: copy data/recorded_run/run.json to the frontend mocks.")
    return target


def run_checks(
    client: httpx.Client,
    runs: int,
    policy: str,
    target: str,
    timeout: float,
    out: Callable[[str], None] = print,
    **kwargs,
) -> list[RunResult]:
    results = []
    for n in range(1, runs + 1):
        out(f"Starting run {n}/{runs}…")
        results.append(check_once(client, n, policy, target, timeout, **kwargs))
        print_result(results[-1], out)
    return results


def main(argv: list[str] | None = None, client: httpx.Client | None = None, out: Callable[[str], None] = print, **kwargs) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--api", default="http://localhost:8000")
    parser.add_argument("--policy", default="customer_support")
    parser.add_argument("--target", default="http://localhost:8001")
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=180, help="seconds to wait for each run")
    parser.add_argument("--save-recording", action="store_true")
    args = parser.parse_args(argv)

    client = client or httpx.Client(base_url=args.api, timeout=60)
    try:
        results = run_checks(client, args.runs, args.policy, args.target, args.timeout, out=out, **kwargs)
    except CheckAborted as exc:
        out(f"Demo check aborted: {exc}")
        return 2

    append_log(results, {"api": args.api, "policy": args.policy, "target": args.target})
    out("\n" + summary(results))
    if args.save_recording:
        save_recording(results, out)
    return 0 if all(r.passed for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
