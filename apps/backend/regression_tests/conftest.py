"""Fixtures for generated regression tests (regression_tests/generated/<run_id>/). Owner: BE2."""
import os

import httpx
import pytest


@pytest.fixture
def send():
    """send(prompt) -> {response, tool_calls} from the target agent at TARGET_URL."""
    url = os.environ.get("TARGET_URL", "http://localhost:8001").rstrip("/") + "/chat"

    def _send(prompt: str) -> dict:
        resp = httpx.post(url, json={"message": prompt}, timeout=15)
        resp.raise_for_status()
        return resp.json()

    return _send
