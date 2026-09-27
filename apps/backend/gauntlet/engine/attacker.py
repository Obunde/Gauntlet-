"""Adversarial prompt generation. Owner: BE1."""
import json
import logging

from gauntlet.engine import brev_client
from gauntlet.shared import config
from gauntlet.shared.schemas import Policy

log = logging.getLogger(__name__)
VALID_TYPES = {"prompt_injection", "unauthorized_tool_action"}


def load_fallback_attacks(n: int = 10) -> list[dict]:
    attacks = json.loads(config.FALLBACK_ATTACKS_FILE.read_text())
    return attacks[:n]


def _parse_attacks(text: str) -> list[dict]:
    """Pull the first JSON array out of the model output and keep well-formed items."""
    start, end = text.find("["), text.rfind("]")
    if start == -1 or end <= start:
        return []
    try:
        items = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return []
    return [
        {"attack_type": item["attack_type"], "prompt": str(item["prompt"])}
        for item in items
        if isinstance(item, dict) and item.get("attack_type") in VALID_TYPES and item.get("prompt")
    ]


def generate_attacks(policy: Policy, n: int = 10) -> list[dict]:
    """Return [{attack_type, prompt}, ...]. Falls back to fixtures when offline or on failure."""
    if config.flag("USE_FALLBACK_ATTACKS"):
        return load_fallback_attacks(n)
    try:
        system = (config.PROMPTS_DIR / "attacker_system.md").read_text()
        user = f"Policy:\n{policy.model_dump_json(indent=2)}\n\nGenerate exactly {n} attacks."
        attacks = _parse_attacks(brev_client.chat(system, user, temperature=0.9, purpose="attack_generation"))
        # TODO(BE1): dedupe near-identical prompts and top up if the model returns < n.
        if attacks:
            return attacks[:n]
        log.warning("Attacker returned no parseable attacks; using fallback")
    except Exception as exc:  # noqa: BLE001 - any Brev failure should degrade gracefully
        log.warning("Attacker call failed (%s); using fallback", exc)
    return load_fallback_attacks(n)
