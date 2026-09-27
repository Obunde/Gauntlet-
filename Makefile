# Gauntlet monorepo tasks. Run from the repo root.
# Other roles add their own targets (agent, web, dev, types).
BE     := apps/backend
PYTHON ?= python3
VENV   := $(abspath $(BE)/.venv)
PY     := $(VENV)/bin/python

.PHONY: install-backend api api-live test regress demo-check demo-record openapi

install-backend:
	test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(PY) -m pip install --upgrade pip
	$(PY) -m pip install -e $(BE)

api:
	cd $(BE) && $(PY) -m uvicorn gauntlet.api.main:app --reload --port 8000

# Live mode: runs BE1's pipeline. --reload-dir keeps generated regression tests from restarting the server.
api-live:
	cd $(BE) && API_MODE=live $(PY) -m uvicorn gauntlet.api.main:app --reload --reload-dir gauntlet --port 8000

test:
	cd $(BE) && $(PY) -m pytest tests -q

# Runs every generated regression test against TARGET_URL (default http://localhost:8001).
regress:
	cd $(BE) && $(PY) -m pytest regression_tests/generated -q -p no:cacheprovider --import-mode=importlib

# Pre-demo check against `make api-live` + BE1's target agent. Timings: data/demo_checks.jsonl.
demo-check:
	cd $(BE) && $(PY) -m gauntlet.tools.demo_check --runs 3

# Same, then saves the fastest passing run as data/recorded_run/run.json (previous: run.prev.json).
demo-record:
	cd $(BE) && $(PY) -m gauntlet.tools.demo_check --runs 3 --save-recording

# Needs `make api` running.
openapi:
	curl -sf localhost:8000/openapi.json > docs/openapi.json
