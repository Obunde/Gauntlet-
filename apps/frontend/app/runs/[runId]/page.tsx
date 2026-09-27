"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AttackList from "@/components/AttackList";
import FindingsTable from "@/components/FindingsTable";
import GateBadge from "@/components/GateBadge";
import RemediationPanel from "@/components/RemediationPanel";
import { getIssues } from "@/lib/api";
import type { IssueReport, RegressResponse } from "@/lib/types";
import { useRunPolling } from "@/lib/useRunPolling";

const humanize = (value: string) => value.replaceAll("_", " ");

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const replay = useSearchParams().get("replay") === "1";
  const { run, error, retry } = useRunPolling(runId, replay);
  const [issues, setIssues] = useState<IssueReport | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [regressResult, setRegressResult] = useState<RegressResponse | null>(null);

  useEffect(() => {
    if (run?.status !== "done") return;
    getIssues(runId, replay, run).then(setIssues).catch((cause) => setIssuesError(cause instanceof Error ? cause.message : String(cause)));
  }, [replay, run, runId]);

  if (error) return <div role="alert" className="surface border-red-400/20 p-6 text-sm"><p className="result-red">Unable to load this run: {error}</p><button className="secondary-button mt-4 text-xs" onClick={retry}>Retry</button></div>;
  if (!run) return <div className="surface p-8 text-center text-sm text-zinc-500">Loading run…</div>;

  const breached = run.attacks.filter((attack) => attack.judge.succeeded).length;
  const complete = run.status === "done" || run.status === "error";
  const gate = regressResult?.gate ?? run.gate;
  const fixed = regressResult?.gate === "GREEN";
  const progress = Math.max(12, Math.min(88, 18 + run.attacks.length * 18));

  return (
    <div className="space-y-7">
      <header>
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-200">← New scan</Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Run report</h1><span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${complete ? "border-zinc-700 text-zinc-400" : "border-zinc-700 text-zinc-300"}`}>{run.status}</span></div>
            <p className="mt-2 mono text-xs text-zinc-600">{run.run_id}</p>
          </div>
          <dl className="grid gap-x-7 gap-y-2 text-xs sm:grid-cols-2">
            <div><dt className="text-zinc-600">Target</dt><dd className="mt-0.5 max-w-64 truncate mono text-zinc-300">{run.target_url}</dd></div>
            <div><dt className="text-zinc-600">Policy</dt><dd className="mt-0.5 capitalize text-zinc-300">{humanize(run.policy_id)}</dd></div>
          </dl>
        </div>
      </header>

      <GateBadge gate={gate} />

      <section className="surface grid divide-y divide-zinc-800 sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Run summary">
        {[[run.attacks.length, "Attacks"], [breached, "Failures"], [run.regression_tests.length, "Regression tests"]].map(([value, label]) => (
          <div key={label} className="flex items-baseline justify-between px-4 py-3 sm:block sm:px-5"><span className="text-xl font-semibold text-zinc-100">{value}</span><span className="ml-2 text-xs text-zinc-500">{label}</span></div>
        ))}
      </section>

      {!complete && (
        <section className="surface p-5" aria-live="polite">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-zinc-300">Adversarial testing in progress</span><span className="mono text-xs text-zinc-600">{progress}%</span></div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-zinc-300 transition-all" style={{ width: `${progress}%` }} /></div>
        </section>
      )}

      {run.status === "done" && (
        <section className="space-y-3" aria-labelledby="findings-heading">
          <div className="flex items-center justify-between"><h2 id="findings-heading" className="text-base font-semibold text-zinc-100">Ranked findings</h2><span className="text-xs text-zinc-600">{issues ? (fixed ? 0 : issues.total_failures) : "—"} open</span></div>
          {issuesError ? <div role="alert" className="empty-state result-red">Findings unavailable: {issuesError}</div> : <FindingsTable report={issues} replay={replay} fixed={fixed} />}
        </section>
      )}

      <section className="space-y-3" aria-labelledby="attacks-heading">
        <div className="flex items-center justify-between"><h2 id="attacks-heading" className="text-base font-semibold text-zinc-100">Attack results</h2><span className="text-xs text-zinc-600">{run.attacks.length - breached} blocked · {breached} breached</span></div>
        <AttackList attacks={run.attacks} replay={replay} />
      </section>

      <RemediationPanel
        runId={runId}
        attacks={run.attacks}
        regressionTests={run.regression_tests}
        disabled={run.status !== "done" || run.regression_tests.length === 0}
        onComplete={setRegressResult}
      />
    </div>
  );
}
