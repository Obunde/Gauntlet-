# Gauntlet monorepo tasks. Run from the repo root.
# Other roles add their own targets (agent, web, dev, types).
BE     := apps/backend
PYTHON ?= python3
VENV   := $(abspath $(BE)/.venv)
PY     := $(VENV)/bin/python

.PHONY: install-backend api test openapi

install-backend:
	test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(PY) -m pip install --upgrade pip
	$(PY) -m pip install -e $(BE)

api:
	cd $(BE) && $(PY) -m uvicorn gauntlet.api.main:app --reload --port 8000

test:
	cd $(BE) && $(PY) -m pytest tests -q

# Needs `make api` running.
openapi:
	curl -sf localhost:8000/openapi.json > docs/openapi.json
