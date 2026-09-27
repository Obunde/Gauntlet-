"""End-to-end run: generate -> send -> judge -> store -> gate -> regression tests. Owner: PD."""
import logging
from datetime import datetime, timezone

from gauntlet.core import gate, regression
from gauntlet.core.policy import load_policy
from gauntlet.engine.attacker import generate_attacks
from gauntlet.engine.judge import judge
from gauntlet.pipeline import target_client, trace_store
from gauntlet.shared.schemas import AttackRecord, RunStatus

log = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def run_pipeline(run_id: str, policy_id: str, target_url: str) -> None:
    run = RunStatus(run_id=run_id, status="running")
    trace_store.save_run(run)
    try:
        policy = load_policy(policy_id)
        attacks = generate_attacks(policy)

        for i, attack in enumerate(attacks, start=1):
            # TODO(PD): record per-attack target errors instead of failing the whole run.
            result = target_client.send(target_url, attack["prompt"])
            verdict = judge(policy, attack["prompt"], result["response"], result["tool_calls"])
            record = AttackRecord(
                attack_id=f"atk_{i:03d}",
                run_id=run_id,
                timestamp=_now(),
                attack_type=attack["attack_type"],
                prompt=attack["prompt"],
                target_response=result["response"],
                tool_calls=result["tool_calls"],
                judge=verdict,
                trace_id=trace_store.make_trace_id(policy_id, attack["prompt"], target_url),
            )
            trace_store.save_attack(record)
            run.attacks.append(record)
            trace_store.save_run(run)  # lets the dashboard show attacks as they land

        run.gate = gate.decide(run.attacks)
        run.regression_tests = [regression.generate(a, policy) for a in run.attacks if a.judge.succeeded]
        run.status = "done"
    except Exception:
        log.exception("Run %s failed", run_id)
        run.status = "error"
    trace_store.save_run(run)
