# Gauntlet monorepo tasks. Run from the repo root.
BE     := apps/backend
FE     := apps/frontend
PYTHON ?= python3
VENV   := $(abspath $(BE)/.venv)
PY     := $(VENV)/bin/python

.PHONY: install agent api web dev types regress test harden

install:
	test -d $(VENV) || $(PYTHON) -m venv $(VENV)
	$(PY) -m pip install --upgrade pip
	$(PY) -m pip install -e $(BE)
	cd $(FE) && npm install

agent:
	cd $(BE) && $(PY) -m uvicorn target_agent.app:app --port 8001

api:
	cd $(BE) && $(PY) -m uvicorn gauntlet.api.main:app --port 8000 --reload --reload-dir gauntlet

web:
	cd $(FE) && npm run dev

dev:
	npx --yes concurrently -n agent,api,web -c yellow,cyan,magenta "$(MAKE) agent" "$(MAKE) api" "$(MAKE) web"

types:
	npx --yes openapi-typescript http://localhost:8000/openapi.json -o $(FE)/lib/types.ts

regress:
	cd $(BE) && $(PY) -m pytest regression_tests/generated -q

test:
	cd $(BE) && $(PY) -m pytest tests -q

# Stops the running target agent (e.g. the one started by `make dev`) and restarts it hardened.
harden:
	-pkill -f "[t]arget_agent.app:app"
	sleep 1
	cd $(BE) && HARDENED=1 $(PY) -m uvicorn target_agent.app:app --port 8001
