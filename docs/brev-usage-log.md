# Brev usage log

Every Brev call is appended to `apps/backend/data/brev_usage.jsonl` by
`gauntlet/engine/brev_client.py` as `{time, model, purpose, prompt_tokens, completion_tokens, total_tokens}`.

## Generated Usage Table

| Time | Model | Purpose | Tokens | Credits |
|---|---|---|---|---|
