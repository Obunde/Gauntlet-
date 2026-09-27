from conftest import make_attack

from gauntlet.core.policy import load_policy
from gauntlet.core.regression import generate, run_tests

RUN_ID = "run_20260927_001"


def test_red_when_vulnerable_green_when_hardened(fake_target):
    generate(make_attack(), load_policy("customer_support"), RUN_ID)

    rr = run_tests(RUN_ID, fake_target.url)
    assert rr.gate == "RED"
    assert [(r.test_id, r.passed) for r in rr.results] == [("reg_001", False)]

    fake_target.hardened = True
    rr = run_tests(RUN_ID, fake_target.url)
    assert rr.gate == "GREEN"
    assert [(r.test_id, r.passed) for r in rr.results] == [("reg_001", True)]


def test_unreachable_target_is_red(unreachable_url):
    generate(make_attack(), load_policy("customer_support"), RUN_ID)
    rr = run_tests(RUN_ID, unreachable_url)
    assert rr.gate == "RED"
    assert rr.results[0].passed is False


def test_no_tests_is_red():
    rr = run_tests(RUN_ID, "http://unused")
    assert rr.gate == "RED"
    assert rr.results == []
