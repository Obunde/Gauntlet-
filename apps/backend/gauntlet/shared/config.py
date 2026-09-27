"""Paths and environment settings, loaded once from apps/backend/.env."""
import os
from pathlib import Path
from typing import Literal

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

load_dotenv(BACKEND_DIR / ".env")


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


# Module level aliases expected by API & tests
API_MODE = os.getenv("API_MODE", "live").strip()
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]
TARGET_URL = os.getenv("TARGET_URL", "http://localhost:8001").strip()


def api_mode() -> str:
    return API_MODE


def cors_origins() -> list[str]:
    return CORS_ORIGINS


def target_url() -> str:
    return TARGET_URL

