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

  if (error) return <div className="panel border-rose-400/20 p-6 text-sm text-rose-300">Unable to load this trace: {error}</div>;
  if (!run) return <div className="panel p-8 text-center text-sm text-slate-500">Loading trace…</div>;

  const attack = run.attacks.find((record) => record.attack_id === attackId);
  if (!attack) return <div className="panel p-6 text-sm text-slate-500">Attack {attackId} was not found in {runId}.</div>;
  const test = run.regression_tests.find((candidate) => candidate.source_attack_id === attackId);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/runs/${runId}${replay ? "?replay=1" : ""}`} className="text-xs text-slate-500 hover:text-cyan-300">← {runId}</Link>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">Attack evidence <span className="font-mono text-sm font-normal text-slate-600">{attack.attack_id}</span></h1>
          <p className="mt-2 text-sm capitalize text-slate-400">{attack.attack_type.replaceAll("_", " ")}</p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${attack.judge.succeeded ? "border-rose-300/15 bg-rose-400/10 text-rose-300" : "border-emerald-300/15 bg-emerald-300/10 text-emerald-300"}`}>{attack.judge.succeeded ? "Confirmed breach" : "Attack blocked"}</span>
      </header>

      <section className="space-y-3">
        <div><p className="eyebrow">Reproducible trace</p><h2 className="mt-1 text-lg font-bold text-white">What happened and why</h2></div>
        <TraceViewer attack={attack} />
      </section>

      <section className="space-y-3">
        <div><p className="eyebrow">Never regress</p><h2 className="mt-1 text-lg font-bold text-white">Generated regression test</h2></div>
        {test ? <RegressionCode test={test} /> : <div className="panel p-5 text-sm text-slate-500">No regression test was generated because this attack was blocked.</div>}
      </section>
    </div>
  );
}
