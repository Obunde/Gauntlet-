# FROZEN at Sprint 0 — changes must be announced at the sprint sync.
"""Data contracts shared by every component. See docs/api-contract.md.

ID formats: run_YYYYMMDD_NNN, atk_NNN, reg_NNN,
trace_id = "trc_" + first 12 hex of sha256(policy_id + prompt + target_url).
"""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

AttackType = Literal[
    "prompt_injection",
    "unauthorized_tool_action",
    "sensitive_info_disclosure",
    "system_prompt_leakage",
]
Gate = Literal["RED", "GREEN"]


def _coerce_datetime_to_str(v: str | datetime | None) -> str | None:
    if isinstance(v, datetime):
        return v.isoformat()
    return v


class Policy(BaseModel):
    agent: str
    forbidden_actions: list[str]
    allowed_actions: list[str]
    max_response_length: int


class JudgeVerdict(BaseModel):
    succeeded: bool
    confidence: float = Field(default=1.0, ge=0, le=1)
    reasoning: str
    violated_rule: str | None = None  # "forbidden_actions[i]"


class AttackRecord(BaseModel):
    attack_id: str  # atk_NNN
    run_id: str  # run_YYYYMMDD_NNN
    timestamp: str  # ISO 8601 string
    attack_type: AttackType
    prompt: str
    target_response: str
    tool_calls: list[str]  # e.g. "delete_record(42)"
    judge: JudgeVerdict
    trace_id: str  # trc_<12 hex>

    @field_validator("timestamp", mode="before")
    @classmethod
    def validate_timestamp(cls, v: str | datetime) -> str:
        return _coerce_datetime_to_str(v) or ""


class RegressionTest(BaseModel):
    test_id: str  # reg_NNN
    source_attack_id: str
    language: Literal["python"] = "python"
    code: str
    assertion: str


class RegressionResult(BaseModel):
    test_id: str
    passed: bool


class RegressionRun(BaseModel):
    ran_at: str
    gate: Gate
    results: list[RegressionResult]

    @field_validator("ran_at", mode="before")
    @classmethod
    def validate_ran_at(cls, v: str | datetime) -> str:
        return _coerce_datetime_to_str(v) or ""


class RunStatus(BaseModel):
    run_id: str
    policy_id: str = "customer_support"
    target_url: str = "http://localhost:8001"
    status: Literal["pending", "running", "done", "error"]
    gate: Gate | None = None
    created_at: str = ""
    completed_at: str | None = None
    error: str | None = None
    attacks: list[AttackRecord] = []
    regression_tests: list[RegressionTest] = []
    regression_runs: list[RegressionRun] = []

    @field_validator("created_at", "completed_at", mode="before")
    @classmethod
    def validate_created_at(cls, v: str | datetime | None) -> str | None:
        return _coerce_datetime_to_str(v)


class StartRunRequest(BaseModel):
    policy_id: str = "customer_support"
    target_url: str | None = None


class StartRunResponse(BaseModel):
    run_id: str


class GuardRequest(BaseModel):
    enabled: bool


class GuardResponse(BaseModel):
    enabled: bool


class HealthResponse(BaseModel):
    ok: bool = True
    mode: Literal["mock", "live"] = "live"
    pipeline_ready: bool = True


class BrevTelemetryResponse(BaseModel):
    instance_name: str = "mechanical-chocolate-wolf"
    gpu_spec: str = "NVIDIA L40S 48GB Tensor Core GPU"
    provider: str = "NVIDIA Brev Cloud"
    base_url: str
    active_model: str
    total_invocations: int
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    avg_tokens_per_request: float
    throughput_est_tokens_sec: float
    latency_avg_ms: int
    speedup_vs_cloud_api: str
    purpose_breakdown: dict[str, int]


class AttackPrompt(BaseModel):
    attack_type: AttackType
    prompt: str


class TargetReply(BaseModel):
    response: str
    tool_calls: list[str]


# Added Sprint 3 — announced at sync. Additive only: no existing model changed.
class IssueGroup(BaseModel):
    issue_id: str  # iss_NNN, by rank
    violated_tool: str
    attack_type: str
    severity: Literal["critical", "high", "medium", "low"]
    occurrences: int
    max_confidence: float
    score: float  # severity weight × occurrences × max_confidence
    attack_ids: list[str]
    trace_ids: list[str]
    example_prompt: str
    regression_test_ids: list[str]
    fixed: bool | None  # None until a regression run exists


class IssueReport(BaseModel):
    run_id: str
    total_attacks: int
    total_failures: int
    groups: list[IssueGroup]
