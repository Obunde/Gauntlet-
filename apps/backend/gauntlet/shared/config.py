"""Paths and environment settings. apps/backend/.env is loaded once; values are read on each
call so tests and `make api-live` can change them without re-importing."""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parents[1] if len(BACKEND_DIR.parents) > 1 else BACKEND_DIR

POLICIES_DIR = BACKEND_DIR / "policies"
DATA_DIR = BACKEND_DIR / "data"
RUNS_DIR = DATA_DIR / "runs"
RECORDED_RUN_PATH = DATA_DIR / "recorded_run" / "run.json"
REGRESSION_DIR = BACKEND_DIR / "regression_tests"
GENERATED_TESTS_DIR = REGRESSION_DIR / "generated"
BREV_USAGE_FILE = DATA_DIR / "brev_usage.jsonl"
FALLBACK_ATTACKS_FILE = BACKEND_DIR / "fallback" / "attacks.json"
PROMPTS_DIR = BACKEND_DIR / "gauntlet" / "engine" / "prompts"

load_dotenv(BACKEND_DIR / ".env", override=True)


def env(key: str, default: str = "") -> str:
    """Retrieve environment variable with fallback."""
    return os.getenv(key, default)


def flag(key: str, default: bool = False) -> bool:
    """Retrieve environment boolean flag."""
    val = os.getenv(key, "").strip().lower()
    if val in ("1", "true", "yes", "on"):
        return True
    if val in ("0", "false", "no", "off"):
        return False
    return default


def api_mode() -> str:
    """'mock' (default) or 'live'."""
    mode = os.getenv("API_MODE", "mock").strip()
    if mode not in ("mock", "live"):
        raise ValueError(f"API_MODE must be 'mock' or 'live', got {mode!r}")
    return mode


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


def target_url() -> str:
    return os.getenv("TARGET_URL", "http://localhost:8001").strip()
