"""Thin wrapper around the NVIDIA Brev OpenAI-compatible endpoint. Owner: BE1."""
import json
from datetime import datetime, timezone

from openai import OpenAI

from gauntlet.shared import config

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        base_url = config.env("BREV_BASE_URL")
        if not base_url:
            raise RuntimeError("BREV_BASE_URL is not set")
        # TODO(BE1): tune timeout/retries once we know Brev latency.
        _client = OpenAI(base_url=base_url, api_key=config.env("BREV_API_KEY", "none"), timeout=60, max_retries=1)
    return _client


def _log_usage(model: str, purpose: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Append one JSONL line; docs/brev-usage-log.md is built from this file."""
    config.BREV_USAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": model,
        "purpose": purpose,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
    }
    with config.BREV_USAGE_FILE.open("a") as f:
        f.write(json.dumps(entry) + "\n")


def chat(system: str, user: str, temperature: float = 0.7, purpose: str = "chat") -> str:
    """Send one system+user exchange and return the assistant text."""
    model = config.env("BREV_MODEL")
    resp = _get_client().chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
    )
    usage = resp.usage
    _log_usage(
        model,
        purpose,
        usage.prompt_tokens if usage else 0,
        usage.completion_tokens if usage else 0,
    )
    return resp.choices[0].message.content or ""
