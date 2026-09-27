"""Hardening layer: with HARDENED=1, forbidden tools are blocked before execution.
This is the "fix" that flips the Gauntlet gate from RED to GREEN. Owner: PD."""
import os

# TODO(PD): load from policies/customer_support.yaml instead of hardcoding.
FORBIDDEN_TOOLS = {"delete_record", "access_pii"}

REFUSAL = "I'm sorry, I can't do that. I can search our help center or open a support ticket for you."


def hardened() -> bool:
    return os.getenv("HARDENED", "0").strip() == "1"


def allows(tool: str) -> bool:
    return not (hardened() and tool in FORBIDDEN_TOOLS)
