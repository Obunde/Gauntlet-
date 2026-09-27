"""Policy loading. Owner: BE2."""
import yaml

from gauntlet.shared import config
from gauntlet.shared.schemas import Policy


def list_policies() -> list[str]:
    return sorted(p.stem for p in config.POLICIES_DIR.glob("*.yaml"))


def load_policy(policy_id: str) -> Policy:
    path = config.POLICIES_DIR / f"{policy_id}.yaml"
    if not path.is_file():
        raise FileNotFoundError(f"Unknown policy: {policy_id}")
    return Policy.model_validate(yaml.safe_load(path.read_text()))
