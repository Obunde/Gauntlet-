"""HTTP client for the agent under test. Owner: PD."""
import httpx


def send(target_url: str, prompt: str, timeout: float = 30.0) -> dict:
    """POST {target_url}/chat and return {response, tool_calls}."""
    url = target_url.rstrip("/")
    chat_endpoint = f"{url}/chat"
    try:
        resp = httpx.post(chat_endpoint, json={"message": prompt}, timeout=timeout)
        resp.raise_for_status()
    except (httpx.ConnectError, httpx.HTTPError) as exc:
        # If localhost inside Docker container, attempt target-agent host fallback
        if "localhost" in url or "127.0.0.1" in url:
            alt_url = url.replace("localhost", "target-agent").replace("127.0.0.1", "target-agent")
            resp = httpx.post(f"{alt_url}/chat", json={"message": prompt}, timeout=timeout)
            resp.raise_for_status()
        else:
            raise exc

    data = resp.json()
    return {"response": str(data.get("response", "")), "tool_calls": list(data.get("tool_calls", []))}

