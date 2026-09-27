import pytest

from gauntlet.shared import config


@pytest.fixture(autouse=True)
def tmp_runs_dir(tmp_path, monkeypatch):
    """Keep test runs out of data/runs/."""
    monkeypatch.setattr(config, "RUNS_DIR", tmp_path / "runs")
    return config.RUNS_DIR
