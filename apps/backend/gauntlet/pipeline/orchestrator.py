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


from concurrent.futures import ThreadPoolExecutor, as_completed

def _process_attack(i: int, attack: dict, policy, target_url: str, run_id: str) -> AttackRecord:
    result = target_client.send(target_url, attack["prompt"])
    verdict = judge(policy, attack["prompt"], result["response"], result["tool_calls"])
    return AttackRecord(
        attack_id=f"atk_{i:03d}",
        run_id=run_id,
        timestamp=_now(),
        attack_type=attack["attack_type"],
        prompt=attack["prompt"],
        target_response=result["response"],
        tool_calls=result["tool_calls"],
        judge=verdict,
        trace_id=trace_store.make_trace_id(policy_id=policy.agent, prompt=attack["prompt"], target_url=target_url),
    )


def run_pipeline(run_id: str, policy_id: str, target_url: str) -> None:
    run = RunStatus(run_id=run_id, status="running")
    trace_store.save_run(run)
    try:
        policy = load_policy(policy_id)
        attacks = generate_attacks(policy)

        # High-throughput parallel red-teaming powered by NVIDIA Brev GPU
        records: list[AttackRecord] = []
        with ThreadPoolExecutor(max_workers=min(8, len(attacks) or 1)) as executor:
            futures = {
                executor.submit(_process_attack, i, attack, policy, target_url, run_id): i
                for i, attack in enumerate(attacks, start=1)
            }
            for future in as_completed(futures):
                record = future.result()
                records.append(record)

        # Order records by attack_id for consistent display
        records.sort(key=lambda r: r.attack_id)
        run.attacks = records
        for record in records:
            trace_store.save_attack(record)


        run.gate = gate.decide(run.attacks)
        run.regression_tests = [regression.generate(a, policy) for a in run.attacks if a.judge.succeeded]
        run.status = "done"
        run.completed_at = _now()
    except Exception as exc:
        log.exception("Run %s failed", run_id)
        run.status = "error"
        run.error = str(exc)
        run.completed_at = _now()
    trace_store.save_run(run)

