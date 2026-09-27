"""File-based run storage: data/runs/<run_id>/run.json holds the full RunStatus. Owner: BE2."""
import hashlib
import os
import re
import threading
from datetime import datetime, timezone

from gauntlet.shared import config
from gauntlet.shared.schemas import AttackRecord, RegressionRun, RunStatus

RUN_ID_RE = re.compile(r"run_\d{8}_\d{3}")

_locks: dict[str, threading.RLock] = {}
_locks_guard = threading.Lock()


def _lock(run_id: str) -> threading.RLock:
    with _locks_guard:
        return _locks.setdefault(run_id, threading.RLock())


def _run_file(run_id: str):
    if not RUN_ID_RE.fullmatch(run_id):
        raise ValueError(f"Invalid run_id: {run_id!r}")
    return config.RUNS_DIR / run_id / "run.json"


def make_trace_id(policy_id: str, prompt: str, target_url: str) -> str:
    """Deterministic: the same (policy, prompt, target) always yields the same trace id."""
    return "trc_" + hashlib.sha256((policy_id + prompt + target_url).encode()).hexdigest()[:12]


def next_run_id() -> str:
    """Reserve and return run_YYYYMMDD_NNN, NNN counting up per UTC day."""
    prefix = "run_" + datetime.now(timezone.utc).strftime("%Y%m%d") + "_"
    config.RUNS_DIR.mkdir(parents=True, exist_ok=True)
    with _locks_guard:
        n = len(list(config.RUNS_DIR.glob(prefix + "*"))) + 1
        while True:
            run_id = f"{prefix}{n:03d}"
            try:
                (config.RUNS_DIR / run_id).mkdir()  # reserves the id against concurrent callers
                return run_id
            except FileExistsError:
                n += 1


def save_run(run: RunStatus) -> None:
    path = _run_file(run.run_id)
    with _lock(run.run_id):
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(run.model_dump_json(indent=2))
        os.replace(tmp, path)  # atomic, so readers never see a half-written file


def load_run(run_id: str) -> RunStatus | None:
    if not RUN_ID_RE.fullmatch(run_id):
        return None
    path = _run_file(run_id)
    with _lock(run_id):
        if not path.is_file():
            return None
        return RunStatus.model_validate_json(path.read_text())


def list_runs() -> list[str]:
    if not config.RUNS_DIR.is_dir():
        return []
    return sorted(p.parent.name for p in config.RUNS_DIR.glob("*/run.json"))


def add_attack(run_id: str, rec: AttackRecord) -> RunStatus:
    with _lock(run_id):
        run = _require(run_id)
        run.attacks.append(rec)
        save_run(run)
        return run


def add_regression_run(run_id: str, rr: RegressionRun) -> RunStatus:
    """Append a regression run; its gate becomes the run's top-level gate."""
    with _lock(run_id):
        run = _require(run_id)
        run.regression_runs.append(rr)
        run.gate = rr.gate
        save_run(run)
        return run


def _require(run_id: str) -> RunStatus:
    run = load_run(run_id)
    if run is None:
        raise KeyError(f"Unknown run: {run_id}")
    return run
