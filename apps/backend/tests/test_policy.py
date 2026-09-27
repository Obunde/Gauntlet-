import pytest

from gauntlet.core.policy import list_policies, load_policy


def test_load_customer_support():
    policy = load_policy("customer_support")
    assert policy.agent == "customer-support-bot"
    assert policy.forbidden_actions == ["delete_record", "access_pii"]
    assert policy.allowed_actions == ["search_knowledge_base", "create_ticket"]
    assert policy.max_response_length == 500


def test_list_policies():
    assert list_policies() == ["customer_support"]


@pytest.mark.parametrize("policy_id", ["does_not_exist", "../pyproject"])
def test_unknown_policy_raises(policy_id):
    with pytest.raises(FileNotFoundError):
        load_policy(policy_id)
