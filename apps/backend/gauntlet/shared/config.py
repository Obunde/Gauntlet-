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

load_dotenv(BACKEND_DIR / ".env")


def env(key: str, default: str = "") -> str:
    """Retrieve environment variable with fallback."""
    return os.getenv(key, default)


def api_mode() -> str:
    return os.getenv("API_MODE", "live").strip()


def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


def target_url() -> str:
    return os.getenv("TARGET_URL", "http://localhost:8001")
