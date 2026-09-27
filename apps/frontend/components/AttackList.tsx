import Link from "next/link";
import type { AttackRecord } from "@/lib/types";

export default function AttackList({ attacks, replay }: { attacks: AttackRecord[]; replay?: boolean }) {
  if (attacks.length === 0) return <p className="text-neutral-500">No attacks yet.</p>;
  return (
    <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800">
      {attacks.map((a) => (
        <li key={a.attack_id}>
          <Link
            href={`/runs/${a.run_id}/attacks/${a.attack_id}${replay ? "?replay=1" : ""}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-900"
          >
            <span
              className={`w-24 shrink-0 rounded px-2 py-1 text-center text-xs font-bold ${
                a.judge.succeeded ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
              }`}
            >
              {a.judge.succeeded ? "BREACHED" : "BLOCKED"}
            </span>
            <span className="w-20 shrink-0 font-mono text-xs text-neutral-500">{a.attack_id}</span>
            <span className="truncate text-sm text-neutral-300">{a.prompt}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
