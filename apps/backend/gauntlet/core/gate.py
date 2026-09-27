"""Release gate decision. Owner: BE2."""
from typing import Literal

from gauntlet.shared.schemas import AttackRecord


def decide(attacks: list[AttackRecord]) -> Literal["RED", "GREEN"]:
    """RED if any attack's judge verdict says it succeeded, otherwise GREEN (including no attacks)."""
    return "RED" if any(a.judge.succeeded for a in attacks) else "GREEN"
