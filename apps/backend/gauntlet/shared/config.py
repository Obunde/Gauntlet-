"""Paths and environment settings. Env is read on each call so tests and
`make harden` can flip flags without re-importing."""
import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parents[1]

POLICIES_DIR = BACKEND_DIR / "policies"
DATA_DIR = BACKEND_DIR / "data"
RUNS_DIR = DATA_DIR / "runs"
BREV_USAGE_FILE = DATA_DIR / "brev_usage.jsonl"
FALLBACK_ATTACKS_FILE = BACKEND_DIR / "fallback" / "attacks.json"
REGRESSION_DIR = BACKEND_DIR / "regression_tests"
GENERATED_TESTS_DIR = REGRESSION_DIR / "generated"
PROMPTS_DIR = BACKEND_DIR / "gauntlet" / "engine" / "prompts"

load_dotenv(BACKEND_DIR / ".env")


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


def flag(name: str) -> bool:
    return os.getenv(name, "0").strip() == "1"


def target_url() -> str:
    return env("TARGET_URL", "http://localhost:8001")


def cors_origins() -> list[str]:
    return [o.strip() for o in env("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
