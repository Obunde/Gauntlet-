import Link from "next/link";
import type { AttackRecord } from "@/lib/types";

export default function AttackList({ attacks, replay }: { attacks: AttackRecord[]; replay?: boolean }) {
  if (attacks.length === 0)
    return <div className="panel p-6 text-center text-xs font-mono font-bold text-slate-500 bg-white rounded-2xl">Waiting for attack results…</div>;

  return (
    <div className="panel overflow-hidden p-0 border border-slate-200 bg-white rounded-2xl shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono font-extrabold uppercase text-slate-600">
            <th className="px-5 py-3.5">Result</th>
            <th className="px-5 py-3.5">Attack</th>
            <th className="px-5 py-3.5">Confidence</th>
            <th className="px-5 py-3.5" aria-label="Open" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {attacks.map((attack) => (
            <tr key={attack.attack_id} className="hover:bg-sky-50/50 transition-colors">
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold uppercase border ${
                    attack.judge.succeeded
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {attack.judge.succeeded ? "Breached" : "Blocked"}
                </span>
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/runs/${attack.run_id}/attacks/${attack.attack_id}${replay ? "?replay=1" : ""}`}
                  className="font-bold capitalize text-slate-900 hover:text-sky-700 hover:underline text-sm"
                >
                  {attack.attack_type.replaceAll("_", " ")}
                </Link>
                <span className="mt-1 block max-w-2xl truncate text-xs text-slate-600 font-medium">{attack.prompt}</span>
              </td>
              <td className="px-5 py-4 font-mono font-bold text-slate-900">{Math.round(attack.judge.confidence * 100)}%</td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/runs/${attack.run_id}/attacks/${attack.attack_id}${replay ? "?replay=1" : ""}`}
                  aria-label={`Open ${attack.attack_type}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition-all font-bold"
                >
                  →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
