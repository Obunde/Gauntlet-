"""File-based storage for runs and attack traces under data/runs/<run_id>/. Owner: PD."""
import hashlib
from datetime import datetime, timezone

from gauntlet.shared import config
from gauntlet.shared.schemas import AttackRecord, RunStatus


def make_trace_id(policy_id: str, prompt: str, target_url: str) -> str:
    """Deterministic: the same (policy, prompt, target) always yields the same trace id."""
    return "trc_" + hashlib.sha256((policy_id + prompt + target_url).encode()).hexdigest()[:12]


def new_run_id() -> str:
    """run_YYYYMMDD_NNN, NNN counting up per day."""
    prefix = "run_" + datetime.now(timezone.utc).strftime("%Y%m%d") + "_"
    config.RUNS_DIR.mkdir(parents=True, exist_ok=True)
    existing = [int(p.name[len(prefix):]) for p in config.RUNS_DIR.glob(prefix + "*") if p.name[len(prefix):].isdigit()]
    return f"{prefix}{max(existing, default=0) + 1:03d}"


def run_dir(run_id: str):
    return config.RUNS_DIR / run_id


def save_run(run: RunStatus) -> None:
    path = run_dir(run.run_id)
    path.mkdir(parents=True, exist_ok=True)
    tmp = path / "run.json.tmp"
    tmp.write_text(run.model_dump_json(indent=2))
    tmp.replace(path / "run.json")  # atomic so the API never reads a half-written file


def load_run(run_id: str) -> RunStatus | None:
    path = run_dir(run_id) / "run.json"
    if not path.is_file():
        return None
    return RunStatus.model_validate_json(path.read_text())


def save_attack(attack: AttackRecord) -> None:
    path = run_dir(attack.run_id) / "attacks"
    path.mkdir(parents=True, exist_ok=True)
    (path / f"{attack.attack_id}.json").write_text(attack.model_dump_json(indent=2))


def load_attack(run_id: str, attack_id: str) -> AttackRecord | None:
    path = run_dir(run_id) / "attacks" / f"{attack_id}.json"
    if not path.is_file():
        return None
    return AttackRecord.model_validate_json(path.read_text())
