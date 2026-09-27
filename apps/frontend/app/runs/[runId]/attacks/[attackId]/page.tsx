"use client";

// Owner: FE2
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import RegressionCode from "@/components/RegressionCode";
import TraceViewer from "@/components/TraceViewer";
import { useRunPolling } from "@/lib/useRunPolling";

export default function AttackPage() {
  const { runId, attackId } = useParams<{ runId: string; attackId: string }>();
  const replay = useSearchParams().get("replay") === "1";
  const { run, error } = useRunPolling(runId, replay);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!run) return <p className="text-neutral-500">Loading…</p>;

  const attack = run.attacks.find((a) => a.attack_id === attackId);
  if (!attack) return <p className="text-neutral-500">Attack {attackId} not found in {runId}.</p>;
  const test = run.regression_tests.find((t) => t.source_attack_id === attackId);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/runs/${runId}${replay ? "?replay=1" : ""}`} className="text-sm text-neutral-500 hover:text-neutral-300">
          ← {runId}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {attack.attack_id} <span className="text-base font-normal text-neutral-500">{attack.attack_type}</span>
        </h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Trace</h2>
        <TraceViewer attack={attack} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Regression test</h2>
        {test ? <RegressionCode test={test} /> : <p className="text-neutral-500">No test: this attack was blocked.</p>}
      </section>
      {/* TODO(FE2): side-by-side diff of this trace vs. the same trace_id in a later (hardened) run. */}
    </div>
  );
}
