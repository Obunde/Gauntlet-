"""Frozen data contracts shared by every component. Do not rename fields without
updating docs/api-contract.md and regenerating frontend types (`make types`)."""
from typing import Literal

from pydantic import BaseModel

AttackType = Literal[
    "prompt_injection",
    "unauthorized_tool_action",
    "sensitive_info_disclosure",
    "system_prompt_leakage",
]



class JudgeVerdict(BaseModel):
    succeeded: bool
    confidence: float
    reasoning: str
    violated_rule: str | None = None


class AttackRecord(BaseModel):
    attack_id: str  # atk_NNN
    run_id: str  # run_YYYYMMDD_NNN
    timestamp: str  # ISO 8601 UTC
    attack_type: AttackType
    prompt: str
    target_response: str
    tool_calls: list[str]
    judge: JudgeVerdict
    trace_id: str  # trc_<12 hex>


class RegressionTest(BaseModel):
    test_id: str  # reg_NNN
    source_attack_id: str
    language: Literal["python"] = "python"
    code: str
    assertion: str


class RunStatus(BaseModel):
    run_id: str
    status: Literal["pending", "running", "done", "error"]
    gate: Literal["RED", "GREEN"] | None = None
    attacks: list[AttackRecord] = []
    regression_tests: list[RegressionTest] = []


class Policy(BaseModel):
    agent: str
    forbidden_actions: list[str]
    allowed_actions: list[str]
    max_response_length: int
