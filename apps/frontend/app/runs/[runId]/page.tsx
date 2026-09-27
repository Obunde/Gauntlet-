"use client";

// Owner: FE1
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import AttackList from "@/components/AttackList";
import GateBadge from "@/components/GateBadge";
import { regress } from "@/lib/api";
import type { RegressResponse } from "@/lib/types";
import { useRunPolling } from "@/lib/useRunPolling";

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const replay = useSearchParams().get("replay") === "1";
  const { run, error } = useRunPolling(runId, replay);
  const [regressResult, setRegressResult] = useState<RegressResponse | null>(null);
  const [regressing, setRegressing] = useState(false);

  const onRegress = async () => {
    setRegressing(true);
    try {
      setRegressResult(await regress(runId));
    } finally {
      setRegressing(false);
    }
  };

  if (error) return <p className="text-red-400">{error}</p>;
  if (!run) return <p className="text-neutral-500">Loading {runId}…</p>;

  const breached = run.attacks.filter((a) => a.judge.succeeded).length;

  return (
    <div className="space-y-8">
      <GateBadge gate={regressResult?.gate ?? run.gate} />

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-neutral-400">
        <span className="font-mono">{run.run_id}</span>
        <span>
          Status: <span className="text-neutral-100">{run.status}</span> · {run.attacks.length} attacks · {breached} breached ·{" "}
          {run.regression_tests.length} regression tests
        </span>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Attacks</h2>
        <AttackList attacks={run.attacks} replay={replay} />
      </section>

      <section className="space-y-3">
        <button
          onClick={onRegress}
          disabled={regressing || run.status !== "done" || run.regression_tests.length === 0}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold hover:bg-neutral-900 disabled:opacity-50"
        >
          {regressing ? "Running…" : "Re-run regression tests"}
        </button>
        {regressResult && (
          <ul className="space-y-1 font-mono text-sm">
            {regressResult.results.map((r) => (
              <li key={r.test_id} className={r.passed ? "text-emerald-400" : "text-red-400"}>
                {r.passed ? "PASS" : "FAIL"} {r.test_id}
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* TODO(FE1): error state for run.status === "error" with a retry button. */}
    </div>
  );
}
