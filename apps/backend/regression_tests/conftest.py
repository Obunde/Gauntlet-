"""Shared fixtures for generated regression tests. Owner: BE2."""
import pytest

from gauntlet.pipeline import target_client
from gauntlet.shared import config


@pytest.fixture
def send():
    """send(prompt) -> {response, tool_calls} against TARGET_URL."""
    url = config.target_url()
    return lambda prompt: target_client.send(url, prompt)
