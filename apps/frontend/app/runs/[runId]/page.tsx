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

  if (error) return <div role="alert" className="surface border-rose-300 bg-rose-50 p-6 text-sm text-rose-800 rounded-2xl"><p className="font-bold">Unable to load this run: {error}</p><button className="secondary-button mt-4 text-xs font-bold" onClick={retry}>Retry</button></div>;
  if (!run) return <div className="surface p-8 text-center text-sm text-slate-500 font-mono bg-white rounded-2xl">Loading run…</div>;

  const breached = run.attacks.filter((attack) => attack.judge.succeeded).length;
  const complete = run.status === "done" || run.status === "error";
  const gate = regressResult?.gate ?? run.gate;
  const fixed = regressResult?.gate === "GREEN";
  const progress = Math.max(12, Math.min(88, 18 + run.attacks.length * 18));

  return (
    <div className="space-y-7 bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 pb-5">
        <Link href="/dashboard" className="text-xs font-bold font-mono text-sky-700 hover:text-sky-800 flex items-center gap-1">← Back to Dashboard</Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Security Audit Run Report</h1>
              <span className={`rounded-lg border px-3 py-1 text-xs font-bold font-mono uppercase ${complete ? "border-slate-300 bg-slate-100 text-slate-700" : "border-sky-300 bg-sky-50 text-sky-800"}`}>{run.status}</span>
            </div>
            <p className="mt-1.5 mono text-xs font-bold text-slate-500">{run.run_id}</p>
          </div>
          <dl className="grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div><dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Target Endpoint</dt><dd className="mt-0.5 max-w-64 truncate mono font-bold text-slate-900">{run.target_url}</dd></div>
            <div><dt className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Security Policy</dt><dd className="mt-0.5 capitalize font-bold text-slate-900">{humanize(run.policy_id)}</dd></div>
          </dl>
        </div>
      </header>

      <GateBadge gate={gate} />

      <section className="surface grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 bg-white border border-slate-200 rounded-2xl shadow-xs" aria-label="Run summary">
        {[[run.attacks.length, "Total Attack Probes"], [breached, "Confirmed Breaches"], [run.regression_tests.length, "Pytest Regression Tests"]].map(([value, label]) => (
          <div key={label} className="flex items-baseline justify-between px-5 py-4 sm:block sm:px-6">
            <span className="text-2xl font-black text-slate-900">{value}</span>
            <span className="ml-2 text-xs font-bold text-slate-600">{label}</span>
          </div>
        ))}
      </section>

      {!complete && (
        <section className="surface p-5 bg-white border border-slate-200 rounded-2xl shadow-xs" aria-live="polite">
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-900">Adversarial testing in progress...</span><span className="mono text-xs font-bold text-sky-700">{progress}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-sky-600 transition-all rounded-full" style={{ width: `${progress}%` }} /></div>
        </section>
      )}

      {run.status === "done" && (
        <section className="space-y-3" aria-labelledby="findings-heading">
          <div className="flex items-center justify-between"><h2 id="findings-heading" className="text-lg font-bold text-slate-900">Ranked Security Findings</h2><span className="text-xs font-mono font-bold text-slate-600">{issues ? (fixed ? 0 : issues.total_failures) : "—"} open vulnerabilities</span></div>
          {issuesError ? <div role="alert" className="empty-state text-rose-700 font-bold">Findings unavailable: {issuesError}</div> : <FindingsTable report={issues} replay={replay} fixed={fixed} />}
        </section>
      )}

      <section className="space-y-3" aria-labelledby="attacks-heading">
        <div className="flex items-center justify-between"><h2 id="attacks-heading" className="text-lg font-bold text-slate-900">OWASP Attack Probe Results</h2><span className="text-xs font-mono font-bold text-slate-600">{run.attacks.length - breached} blocked · {breached} breached</span></div>
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
