"""Attack pipeline: generate -> send -> judge -> trace_store.add_attack. Owner: BE1.

BE2's core/finalize.py sets the gate, regression tests and final status after this returns."""
import logging
from datetime import datetime, timezone

from gauntlet.core.policy import load_policy
from gauntlet.engine.attacker import generate_attacks
from gauntlet.engine.judge import judge
from gauntlet.pipeline import target_client, trace_store
from gauntlet.shared.schemas import AttackRecord

log = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


from concurrent.futures import ThreadPoolExecutor, as_completed

def _process_attack(i: int, attack: dict, policy, target_url: str, run_id: str, policy_id: str) -> AttackRecord:
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
        trace_id=trace_store.make_trace_id(policy_id=policy_id, prompt=attack["prompt"], target_url=target_url),
    )


def run_pipeline(run_id: str, policy_id: str, target_url: str) -> None:
    policy = load_policy(policy_id)
    attacks = generate_attacks(policy)

    # High-throughput parallel red-teaming powered by NVIDIA Brev GPU
    records: list[AttackRecord] = []
    with ThreadPoolExecutor(max_workers=min(8, len(attacks) or 1)) as executor:
        futures = {
            executor.submit(_process_attack, i, attack, policy, target_url, run_id, policy_id): i
            for i, attack in enumerate(attacks, start=1)
        }
        for future in as_completed(futures):
            record = future.result()
            records.append(record)

    # Order records by attack_id for consistent display
    records.sort(key=lambda r: r.attack_id)
    for record in records:
        trace_store.add_attack(run_id, record)

