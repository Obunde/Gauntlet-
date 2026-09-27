"""Thin wrapper around the NVIDIA Brev OpenAI-compatible endpoint. Owner: BE1."""
import json
from datetime import datetime, timezone
from pathlib import Path

from openai import OpenAI

from gauntlet.shared import config

_client: OpenAI | None = None


def reset_client() -> None:
    """Reset global OpenAI client instance (useful for testing or env changes)."""
    global _client
    _client = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        base_url = config.env("BREV_BASE_URL")
        if not base_url:
            raise RuntimeError("BREV_BASE_URL environment variable is not set")
        api_key = config.env("BREV_API_KEY", "none")
        _client = OpenAI(base_url=base_url, api_key=api_key, timeout=60.0, max_retries=2)
    return _client


def _log_usage(model: str, purpose: str, prompt_tokens: int, completion_tokens: int) -> None:
    """Append one JSONL line; docs/brev-usage-log.md is built from this log."""
    config.BREV_USAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": model,
        "purpose": purpose,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": prompt_tokens + completion_tokens,
    }
    with config.BREV_USAGE_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")


def format_usage_table() -> str:
    """Read data/brev_usage.jsonl and generate Markdown table format for docs/brev-usage-log.md."""
    if not config.BREV_USAGE_FILE.exists():
        return "| Time | Model | Purpose | Tokens | Credits |\n|---|---|---|---|---|\n"

    lines = ["| Time | Model | Purpose | Tokens | Credits |", "|---|---|---|---|---|"]
    with config.BREV_USAGE_FILE.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                time_str = data.get("time", "")
                model = data.get("model", "unknown")
                purpose = data.get("purpose", "")
                tokens = data.get("total_tokens", data.get("prompt_tokens", 0) + data.get("completion_tokens", 0))
                lines.append(f"| {time_str} | {model} | {purpose} | {tokens} | - |")
            except json.JSONDecodeError:
                continue
    return "\n".join(lines) + "\n"


def clean_json_response(text: str) -> str:
    """Remove markdown code blocks (```json ... ```) from model output."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def chat(system: str, user: str, temperature: float = 0.7, purpose: str = "chat") -> str:
    """Send one system+user exchange and return the assistant text."""
    model = config.env("BREV_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")
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
    content = resp.choices[0].message.content or ""
    return clean_json_response(content)

