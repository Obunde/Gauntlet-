"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import RegressionCode from "@/components/RegressionCode";
import TraceViewer from "@/components/TraceViewer";
import { useRunPolling } from "@/lib/useRunPolling";

const humanize = (value: string) => value.replaceAll("_", " ");

export default function AttackPage() {
  const { runId, attackId } = useParams<{ runId: string; attackId: string }>();
  const replay = useSearchParams().get("replay") === "1";
  const { run, error, retry } = useRunPolling(runId, replay);

  if (error) return <div role="alert" className="surface border-red-400/20 p-6 text-sm"><p className="result-red">Unable to load this trace: {error}</p><button className="secondary-button mt-4 text-xs" onClick={retry}>Retry</button></div>;
  if (!run) return <div className="surface p-8 text-center text-sm text-zinc-500">Loading evidence…</div>;

  const attack = run.attacks.find((record) => record.attack_id === attackId);
  if (!attack) return <div className="surface p-6 text-sm text-zinc-500">Attack {attackId} was not found in this run.</div>;
  const test = run.regression_tests.find((candidate) => candidate.source_attack_id === attackId);
  const breached = attack.judge.succeeded;

  return (
    <div className="space-y-7">
      <header>
        <Link href={`/runs/${runId}${replay ? "?replay=1" : ""}`} className="text-xs text-zinc-500 hover:text-zinc-200">← Run report</Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 capitalize">{humanize(attack.attack_type)}</h1>
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${breached ? "border-red-400/30 bg-red-500/10 result-red" : "border-green-400/30 bg-green-500/10 result-green"}`}>{breached ? "Breached" : "Blocked"}</span>
            </div>
            <p className="mt-2 mono text-xs text-zinc-600">{attack.attack_id}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-7 gap-y-2 text-xs sm:grid-cols-3">
            <div><dt className="text-zinc-600">Rule</dt><dd className="mt-0.5 max-w-44 truncate text-zinc-300">{attack.judge.violated_rule ?? "None"}</dd></div>
            <div><dt className="text-zinc-600">Confidence</dt><dd className="mt-0.5 mono text-zinc-300">{Math.round(attack.judge.confidence * 100)}%</dd></div>
            <div className="col-span-2 sm:col-span-1"><dt className="text-zinc-600">Trace ID</dt><dd className="mt-0.5 max-w-48 truncate mono text-zinc-300">{attack.trace_id}</dd></div>
          </dl>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,.65fr)]">
        <section className="space-y-3" aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" className="text-base font-semibold text-zinc-100">Evidence flow</h2>
          <TraceViewer attack={attack} />
        </section>
        <aside className="surface p-5 lg:sticky lg:top-20">
          <p className="section-label">Verdict metadata</p>
          <dl className="mt-4 space-y-4 text-xs">
            <div><dt className="text-zinc-600">Outcome</dt><dd className={`mt-1 font-semibold ${breached ? "result-red" : "result-green"}`}>{breached ? "Attack succeeded" : "Attack blocked"}</dd></div>
            <div><dt className="text-zinc-600">Violated rule</dt><dd className="mt-1 text-zinc-300">{attack.judge.violated_rule ?? "No rule violated"}</dd></div>
            <div><dt className="text-zinc-600">Observed tools</dt><dd className="mt-1 text-zinc-300">{attack.tool_calls.length ? attack.tool_calls.join(", ") : "None"}</dd></div>
            <div><dt className="text-zinc-600">Timestamp</dt><dd className="mt-1 mono text-zinc-300">{attack.timestamp}</dd></div>
          </dl>
        </aside>
      </div>

      <section className="space-y-3" aria-labelledby="artifact-heading">
        <div><h2 id="artifact-heading" className="text-base font-semibold text-zinc-100">Regression artifact</h2><p className="mt-1 text-xs text-zinc-500">Keep the failure reproducible in local development and CI.</p></div>
        {test ? <RegressionCode test={test} /> : <div className="empty-state">This attack was blocked, so no regression artifact was generated.</div>}
      </section>
    </div>
  );
}
