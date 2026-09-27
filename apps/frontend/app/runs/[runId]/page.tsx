"use client";

// Owner: FE1
import Link from "next/link";
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

  if (error) return <div className="panel border-rose-400/20 p-6 text-sm text-rose-300">Unable to load this run: {error}</div>;
  if (!run) return <div className="panel p-8 text-center text-sm text-slate-500">Loading {runId}…</div>;

  const breached = run.attacks.filter((attack) => attack.judge.succeeded).length;
  const blocked = run.attacks.length - breached;
  const complete = run.status === "done" || run.status === "error";
  const progress = complete ? 100 : Math.max(12, run.attacks.length * 10);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="text-xs text-slate-500 hover:text-cyan-300">← Dashboard</Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Security run</h1>
          <p className="mt-1 font-mono text-xs text-slate-500">{run.run_id}{replay ? " · recorded replay" : " · live target"}</p>
        </div>
        <span className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${complete ? "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-300" : "border-amber-300/15 bg-amber-300/[0.07] text-amber-200"}`}>{run.status}</span>
      </header>

      <GateBadge gate={regressResult?.gate ?? run.gate} />

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [String(run.attacks.length), "Attacks evaluated", "Brev-generated + fallback"],
          [String(breached), "Policy breaches", breached ? "Release action required" : "No confirmed violations"],
          [String(run.regression_tests.length), "Regression tests", "Generated from failures"],
        ].map(([value, label, note]) => (
          <article key={label} className="panel p-5">
            <span className="text-3xl font-black tracking-tight text-white">{value}</span>
            <p className="mt-2 text-xs font-semibold text-slate-300">{label}</p>
            <p className="mt-1 text-[11px] text-slate-600">{note}</p>
          </article>
        ))}
      </section>

      <section className="panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><p className="eyebrow">Pipeline</p><p className="mt-1 text-sm font-semibold text-slate-200">{complete ? "Run complete" : "Adversarial testing in progress"}</p></div>
          <span className="font-mono text-xs text-slate-500">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-400 transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="mt-4 grid gap-3 text-[11px] text-slate-500 sm:grid-cols-4">
          {["Validate policy", "Generate attacks", "Judge evidence", "Build regressions"].map((step, index) => <span key={step} className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${complete || index < 2 ? "bg-cyan-300" : "bg-slate-700"}`} />{step}</span>)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between"><div><p className="eyebrow">Evidence</p><h2 className="mt-1 text-lg font-bold text-white">Attack results</h2></div><p className="text-xs text-slate-600">{blocked} blocked · {breached} breached</p></div>
        <AttackList attacks={run.attacks} replay={replay} />
      </section>

      <section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="eyebrow">Remediation loop</p><h2 className="mt-1 text-sm font-bold text-white">Verify the fix against generated tests</h2><p className="mt-1 text-xs text-slate-500">Rerun the exact attacks that caused this gate to fail.</p></div>
        <div className="shrink-0">
          <button onClick={onRegress} disabled={regressing || run.status !== "done" || run.regression_tests.length === 0} className="secondary-button">{regressing ? "Running…" : "Re-run regression tests"}</button>
          {regressResult && <ul className="mt-2 space-y-1 font-mono text-xs">{regressResult.results.map((result) => <li key={result.test_id} className={result.passed ? "text-emerald-300" : "text-rose-300"}>{result.passed ? "PASS" : "FAIL"} {result.test_id}</li>)}</ul>}
        </div>
      </section>
    </div>
  );
}
