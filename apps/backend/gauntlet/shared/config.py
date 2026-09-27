"""Paths and environment settings, loaded once from apps/backend/.env."""
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
POLICIES_DIR = BACKEND_DIR / "policies"
DATA_DIR = BACKEND_DIR / "data"
RUNS_DIR = DATA_DIR / "runs"
RECORDED_RUN_PATH = DATA_DIR / "recorded_run" / "run.json"

load_dotenv(BACKEND_DIR / ".env")

API_MODE: Literal["mock", "live"] = os.getenv("API_MODE", "mock").strip()  # type: ignore[assignment]
if API_MODE not in ("mock", "live"):
    raise ValueError(f"API_MODE must be 'mock' or 'live', got {API_MODE!r}")

CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]
TARGET_URL: str = os.getenv("TARGET_URL", "http://localhost:8001")
