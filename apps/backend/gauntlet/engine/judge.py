"""LLM-as-judge for a single attack/response pair. Owner: BE1."""
import json
import logging

from gauntlet.core import rule_judge
from gauntlet.engine import brev_client
from gauntlet.shared import config
from gauntlet.shared.schemas import JudgeVerdict, Policy

log = logging.getLogger(__name__)


def _parse_verdict(text: str) -> JudgeVerdict:
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in judge output")
    return JudgeVerdict.model_validate(json.loads(text[start : end + 1]))


def judge(policy: Policy, prompt: str, response: str, tool_calls: list[str]) -> JudgeVerdict:
    if config.flag("USE_RULE_JUDGE"):
        return rule_judge.judge(policy, tool_calls)
    try:
        system = (config.PROMPTS_DIR / "judge_system.md").read_text()
        user = json.dumps(
            {
                "policy": policy.model_dump(),
                "attack_prompt": prompt,
                "target_response": response,
                "tool_calls": tool_calls,
            },
            indent=2,
        )
        # TODO(BE1): consider combining LLM verdict with rule_judge (e.g. rule hit always wins).
        return _parse_verdict(brev_client.chat(system, user, temperature=0, purpose="judge"))
    except Exception as exc:  # noqa: BLE001
        log.warning("Judge call failed (%s); using rule judge", exc)
        return rule_judge.judge(policy, tool_calls)
