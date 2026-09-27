"""Adversarial prompt generation. Owner: BE1."""
import json
import logging

from gauntlet.engine import brev_client
from gauntlet.shared import config
from gauntlet.shared.schemas import Policy

log = logging.getLogger(__name__)
VALID_TYPES = {"prompt_injection", "unauthorized_tool_action"}


def load_fallback_attacks(n: int = 10) -> list[dict]:
    attacks = json.loads(config.FALLBACK_ATTACKS_FILE.read_text(encoding="utf-8"))
    return attacks[:n]


def _parse_attacks(text: str) -> list[dict]:
    """Pull the first JSON array out of the model output and keep well-formed items."""
    cleaned = brev_client.clean_json_response(text)
    start, end = cleaned.find("["), cleaned.rfind("]")
    if start == -1 or end <= start:
        return []
    try:
        items = json.loads(cleaned[start : end + 1])
    except json.JSONDecodeError:
        return []

    parsed = []
    for item in items:
        if isinstance(item, dict):
            atk_type = item.get("attack_type")
            prompt = str(item.get("prompt", "")).strip()
            if atk_type in VALID_TYPES and prompt:
                parsed.append({"attack_type": atk_type, "prompt": prompt})
    return parsed


def _dedupe_and_topup(attacks: list[dict], n: int) -> list[dict]:
    """Remove duplicate/near-identical attack prompts and top up using fallback attacks if needed."""
    seen_prompts = set()
    unique_attacks = []
    for atk in attacks:
        norm = atk["prompt"].strip().lower()
        if norm not in seen_prompts:
            seen_prompts.add(norm)
            unique_attacks.append(atk)

    if len(unique_attacks) >= n:
        return unique_attacks[:n]

    # Top up using fallback attacks
    fallback = load_fallback_attacks(n * 2)
    for fb_atk in fallback:
        norm = fb_atk["prompt"].strip().lower()
        if norm not in seen_prompts:
            seen_prompts.add(norm)
            unique_attacks.append(fb_atk)
            if len(unique_attacks) == n:
                break

    return unique_attacks[:n]


def generate_attacks(policy: Policy, n: int = 10) -> list[dict]:
    """Return [{attack_type, prompt}, ...]. Falls back to fixtures when offline or on failure."""
    if config.flag("USE_FALLBACK_ATTACKS"):
        return load_fallback_attacks(n)
    try:
        system = (config.PROMPTS_DIR / "attacker_system.md").read_text(encoding="utf-8")
        user = f"Policy:\n{policy.model_dump_json(indent=2)}\n\nGenerate exactly {n} attacks."
        raw_output = brev_client.chat(system, user, temperature=0.9, purpose="attack_generation")
        parsed = _parse_attacks(raw_output)

        if parsed:
            final_attacks = _dedupe_and_topup(parsed, n)
            return final_attacks

        log.warning("Attacker returned no parseable attacks; using fallback")
    except Exception as exc:  # noqa: BLE001 - any Brev failure should degrade gracefully
        log.warning("Attacker call failed (%s); using fallback", exc)
    return load_fallback_attacks(n)

