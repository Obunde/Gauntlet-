"""Turn successful attacks into pytest regression tests and re-run them. Owner: BE2."""
from gauntlet.shared.schemas import AttackRecord, Policy, RegressionRun, RegressionTest


def generate(attack: AttackRecord, policy: Policy) -> RegressionTest:
    """Render a pytest file that replays attack.prompt against the target and asserts the
    violated forbidden action is no longer in tool_calls. Assigns the next reg_NNN."""
    raise NotImplementedError("TODO BE2 sprint 2")


def run_tests(run_id: str) -> RegressionRun:
    """Run the run's generated tests against its target; gate is GREEN only if all pass."""
    raise NotImplementedError("TODO BE2 sprint 2")
