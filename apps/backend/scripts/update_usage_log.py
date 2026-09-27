"""Script to update docs/brev-usage-log.md from data/brev_usage.jsonl."""
from pathlib import Path
import sys

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parents[1]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from gauntlet.engine import brev_client
from gauntlet.shared import config


def update_docs_log():
    table_content = brev_client.format_usage_table()
    doc_path = config.REPO_ROOT / "docs" / "brev-usage-log.md"

    header = """# Brev usage log

Every Brev call is appended to `apps/backend/data/brev_usage.jsonl` by
`gauntlet/engine/brev_client.py` as `{time, model, purpose, prompt_tokens, completion_tokens, total_tokens}`.

## Generated Usage Table

"""
    doc_path.write_text(header + table_content, encoding="utf-8")
    print(f"Updated {doc_path} successfully.")


if __name__ == "__main__":
    update_docs_log()
