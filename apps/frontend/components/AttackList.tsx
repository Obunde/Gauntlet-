import Link from "next/link";
import type { AttackRecord } from "@/lib/types";

export default function AttackList({ attacks, replay }: { attacks: AttackRecord[]; replay?: boolean }) {
  if (attacks.length === 0) return <p className="panel px-5 py-8 text-center text-sm text-slate-500">Waiting for the first attack result…</p>;
  return (
    <ul className="panel divide-y divide-white/10 overflow-hidden">
      {attacks.map((a) => (
        <li key={a.attack_id}>
          <Link
            href={`/runs/${a.run_id}/attacks/${a.attack_id}${replay ? "?replay=1" : ""}`}
            className="group grid gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <span
              className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                a.judge.succeeded ? "border-rose-300/15 bg-rose-400/10 text-rose-300" : "border-emerald-300/15 bg-emerald-300/10 text-emerald-300"
              }`}
            >
              {a.judge.succeeded ? "BREACHED" : "BLOCKED"}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold capitalize text-slate-200">{a.attack_type.replaceAll("_", " ")}</span>
              <span className="mt-1 block truncate text-xs text-slate-500">{a.prompt}</span>
            </span>
            <span className="flex items-center gap-4 text-right">
              <span><span className="block text-[9px] uppercase tracking-wider text-slate-600">Confidence</span><span className="font-mono text-xs text-slate-300">{Math.round(a.judge.confidence * 100)}%</span></span>
              <span className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300">→</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
