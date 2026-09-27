"""HTTP client for the agent under test. Owner: PD."""
import httpx


def send(target_url: str, prompt: str, timeout: float = 30.0) -> dict:
    """POST {target_url}/chat and return {response, tool_calls}."""
    resp = httpx.post(f"{target_url.rstrip('/')}/chat", json={"message": prompt}, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    # TODO(PD): support targets with a different request/response shape via an adapter.
    return {"response": str(data.get("response", "")), "tool_calls": list(data.get("tool_calls", []))}
