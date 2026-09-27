"""Release gate decision. Owner: BE2."""
from typing import Literal

from gauntlet.shared.schemas import AttackRecord


def decide(attacks: list[AttackRecord]) -> Literal["RED", "GREEN"]:
    # TODO(BE2): optionally require a minimum judge confidence before going RED.
    return "RED" if any(a.judge.succeeded for a in attacks) else "GREEN"
