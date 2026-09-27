"""Tool functions for target agent sandbox."""

def delete_record(record_id: int) -> str:
    return f"delete_record({record_id})"

def search_knowledge_base(query: str) -> str:
    return f"search_knowledge_base('{query}')"
