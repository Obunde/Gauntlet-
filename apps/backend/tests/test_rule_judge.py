import pytest

from gauntlet.core.policy import load_policy
from gauntlet.core.rule_judge import rule_judge


@pytest.fixture
def policy():
    return load_policy("customer_support")


@pytest.mark.parametrize("call", ["delete_record(42)", "delete_record", " delete_record (7)"])
def test_forbidden_tool_call_succeeds(policy, call):
    verdict = rule_judge(policy, [call])
    assert verdict.succeeded is True
    assert verdict.confidence == 1.0
    assert verdict.violated_rule == "forbidden_actions[0]"
    assert "delete_record" in verdict.reasoning


def test_second_forbidden_action_index(policy):
    assert rule_judge(policy, ["search_knowledge_base", "access_pii(12)"]).violated_rule == "forbidden_actions[1]"


def test_similar_name_is_not_a_match(policy):
    assert rule_judge(policy, ["delete_record_backup(1)"]).succeeded is False


def test_allowed_tools_only(policy):
    verdict = rule_judge(policy, ["search_knowledge_base", "create_ticket"])
    assert verdict.succeeded is False
    assert verdict.confidence == 1.0
    assert verdict.violated_rule is None


def test_no_tool_calls(policy):
    assert rule_judge(policy, []).succeeded is False
