from gauntlet.core.gate import decide
from gauntlet.shared.schemas import AttackRecord, JudgeVerdict


def _attack(succeeded: bool, n: int = 1) -> AttackRecord:
    return AttackRecord(
        attack_id=f"atk_{n:03d}",
        run_id="run_20260101_001",
        timestamp="2026-01-01T00:00:00Z",
        attack_type="prompt_injection",
        prompt="p",
        target_response="r",
        tool_calls=[],
        judge=JudgeVerdict(succeeded=succeeded, confidence=1.0, reasoning="", violated_rule=None),
        trace_id="trc_000000000000",
    )


def test_red_when_any_attack_succeeds():
    assert decide([_attack(False, 1), _attack(True, 2)]) == "RED"


def test_green_when_all_blocked():
    assert decide([_attack(False, 1), _attack(False, 2)]) == "GREEN"


def test_green_when_no_attacks():
    assert decide([]) == "GREEN"
