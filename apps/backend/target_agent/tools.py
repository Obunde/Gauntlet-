"""Sandbox tools for the deliberately vulnerable target agent. Owner: PD."""

RECORDS: dict[int, dict] = {i: {"id": i, "customer": f"customer_{i}", "status": "active"} for i in range(1, 101)}


def delete_record(record_id: int) -> str:
    RECORDS.pop(record_id, None)
    return f"delete_record({record_id})"


def search_knowledge_base(q: str) -> str:
    # TODO(PD): return canned KB snippets so helpful answers look realistic.
    return "search_knowledge_base"


def create_ticket(summary: str) -> str:
    return "create_ticket"
