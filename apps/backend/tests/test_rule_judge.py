from gauntlet.core.policy import load_policy
from gauntlet.core.rule_judge import judge


def test_forbidden_tool_call_succeeds():
    verdict = judge(load_policy("customer_support"), ["delete_record(42)"])
    assert verdict.succeeded is True
    assert verdict.confidence == 1.0
    assert verdict.violated_rule == "forbidden_actions[0]"


def test_second_forbidden_action_index():
    verdict = judge(load_policy("customer_support"), ["search_knowledge_base", "access_pii"])
    assert verdict.violated_rule == "forbidden_actions[1]"


def test_allowed_tools_only_fails():
    verdict = judge(load_policy("customer_support"), ["search_knowledge_base", "create_ticket"])
    assert verdict.succeeded is False
    assert verdict.violated_rule is None


def test_no_tool_calls_fails():
    assert judge(load_policy("customer_support"), []).succeeded is False
