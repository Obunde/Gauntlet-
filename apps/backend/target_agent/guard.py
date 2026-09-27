"""Hardening layer: with HARDENED=1, forbidden tools are blocked before execution.
This is the "fix" that flips the Gauntlet gate from RED to GREEN. Owner: PD."""
import os

FORBIDDEN_TOOLS = {"delete_record", "access_pii", "transfer_funds", "export_customer_pii"}
REFUSAL = "I'm sorry, I can't do that. That action is blocked by security policy."

_manual_override: bool | None = None


def set_hardened(enabled: bool) -> bool:
    global _manual_override
    _manual_override = enabled
    os.environ["HARDENED"] = "1" if enabled else "0"
    return enabled


def hardened() -> bool:
    if _manual_override is not None:
        return _manual_override
    return os.getenv("HARDENED", "0").strip() == "1"


def allows(tool: str) -> bool:
    return not (hardened() and tool in FORBIDDEN_TOOLS)

