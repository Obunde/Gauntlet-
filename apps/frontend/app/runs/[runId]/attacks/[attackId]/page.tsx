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

  if (error)
    return (
      <div role="alert" className="panel border-rose-300 bg-rose-50 p-6 text-sm text-rose-800 rounded-2xl">
        <p className="font-bold">Unable to load this trace: {error}</p>
        <button className="secondary-button mt-4 text-xs font-bold" onClick={retry}>
          Retry
        </button>
      </div>
    );
  if (!run)
    return <div className="panel p-8 text-center text-sm text-slate-600 font-mono bg-white rounded-2xl">Loading evidence…</div>;

  const attack = run.attacks.find((record) => record.attack_id === attackId);
  if (!attack)
    return <div className="panel p-6 text-sm text-slate-600 bg-white rounded-2xl">Attack {attackId} was not found in this run.</div>;
  const test = run.regression_tests.find((candidate) => candidate.source_attack_id === attackId);
  const breached = attack.judge.succeeded;

  return (
    <div className="space-y-7 bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 pb-5">
        <Link
          href={`/runs/${runId}${replay ? "?replay=1" : ""}`}
          className="text-xs font-mono font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1"
        >
          ← Run report
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 capitalize">
                {humanize(attack.attack_type)}
              </h1>
              <span
                className={`rounded-xl border px-3 py-1 text-xs font-mono font-extrabold uppercase ${
                  breached
                    ? "border-rose-300 bg-rose-100 text-rose-800 shadow-xs"
                    : "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-xs"
                }`}
              >
                {breached ? "Breached" : "Blocked"}
              </span>
            </div>
            <p className="mt-2 mono text-xs font-bold text-slate-500">{attack.attack_id}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-7 gap-y-2 text-xs sm:grid-cols-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Rule</dt>
              <dd className="mt-0.5 max-w-44 truncate font-mono font-bold text-slate-900">
                {attack.judge.violated_rule ?? "None"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Confidence</dt>
              <dd className="mt-0.5 mono font-bold text-slate-900">{Math.round(attack.judge.confidence * 100)}%</dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Trace ID</dt>
              <dd className="mt-0.5 max-w-48 truncate mono font-bold text-slate-900">{attack.trace_id}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,.65fr)]">
        <section className="space-y-3" aria-labelledby="evidence-heading">
          <h2 id="evidence-heading" className="text-lg font-bold text-slate-900">
            Evidence flow
          </h2>
          <TraceViewer attack={attack} />
        </section>
        <aside className="panel p-6 space-y-4 lg:sticky lg:top-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="eyebrow text-sky-700 font-mono font-extrabold">Verdict metadata</p>
          <dl className="space-y-3.5 text-xs">
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Outcome</dt>
              <dd className={`mt-1 font-bold text-sm ${breached ? "text-rose-700" : "text-emerald-700"}`}>
                {breached ? "Attack succeeded" : "Attack blocked"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Violated rule</dt>
              <dd className="mt-1 font-mono font-semibold text-slate-900">
                {attack.judge.violated_rule ?? "No rule violated"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Observed tools</dt>
              <dd className="mt-1 font-mono font-semibold text-slate-900">
                {attack.tool_calls.length ? attack.tool_calls.join(", ") : "None"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Timestamp</dt>
              <dd className="mt-1 mono text-slate-700 font-medium">{attack.timestamp}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="space-y-3" aria-labelledby="artifact-heading">
        <div>
          <h2 id="artifact-heading" className="text-lg font-bold text-slate-900">
            Regression artifact
          </h2>
          <p className="mt-1 text-xs text-slate-600 font-medium">Keep the failure reproducible in local development and CI.</p>
        </div>
        {test ? (
          <RegressionCode test={test} />
        ) : (
          <div className="panel p-6 text-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-200 rounded-2xl">
            This attack was blocked, so no regression artifact was generated.
          </div>
        )}
      </section>
    </div>
  );
}
