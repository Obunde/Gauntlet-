"""Policy loading from policies/<policy_id>.yaml. Owner: BE2."""
import re

import yaml
from pydantic import ValidationError

from gauntlet.shared import config
from gauntlet.shared.schemas import Policy


def list_policies() -> list[str]:
    return sorted(p.stem for p in config.POLICIES_DIR.glob("*.yaml"))


def load_policy(policy_id: str) -> Policy:
    """Raises FileNotFoundError for an unknown id and ValueError for a malformed file."""
    path = config.POLICIES_DIR / f"{policy_id}.yaml"
    if not re.fullmatch(r"\w+", policy_id) or not path.is_file():
        raise FileNotFoundError(f"Unknown policy: {policy_id!r} (available: {list_policies()})")
    try:
        return Policy.model_validate(yaml.safe_load(path.read_text()))
    except (yaml.YAMLError, ValidationError) as exc:
        raise ValueError(f"Invalid policy file {path.name}: {exc}") from exc
