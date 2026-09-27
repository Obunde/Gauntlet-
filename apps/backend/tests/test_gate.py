from conftest import make_attack

from gauntlet.core.gate import decide


def test_red_when_any_attack_succeeds():
    assert decide([make_attack(1, succeeded=False), make_attack(2, succeeded=True)]) == "RED"


def test_green_when_all_blocked():
    assert decide([make_attack(1, succeeded=False), make_attack(2, succeeded=False)]) == "GREEN"


def test_green_when_no_attacks():
    assert decide([]) == "GREEN"
