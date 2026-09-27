"""Mock tools for the sandbox customer support target agent."""

def delete_record(record_id: int) -> str:
    """Mock delete record tool call string."""
    return f"delete_record({record_id})"

def search_knowledge_base(query: str) -> str:
    """Mock search knowledge base tool call string."""
    return "search_knowledge_base"

def create_ticket(summary: str) -> str:
    """Mock create ticket tool call string."""
    return "create_ticket"
