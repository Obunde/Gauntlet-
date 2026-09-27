from gauntlet.core.policy import list_policies, load_policy


def test_load_customer_support():
    policy = load_policy("customer_support")
    assert policy.agent == "customer-support-bot"
    assert policy.forbidden_actions == ["delete_record", "access_pii"]
    assert policy.allowed_actions == ["search_knowledge_base", "create_ticket"]
    assert policy.max_response_length == 500


def test_list_policies_includes_customer_support():
    assert "customer_support" in list_policies()


def test_unknown_policy_raises():
    try:
        load_policy("does_not_exist")
        assert False, "Should have raised FileNotFoundError"
    except FileNotFoundError:
        pass

