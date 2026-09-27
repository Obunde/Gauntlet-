import Link from "next/link";
import type { AttackRecord } from "@/lib/types";

export default function AttackList({ attacks, replay }: { attacks: AttackRecord[]; replay?: boolean }) {
  if (attacks.length === 0) return <div className="empty-state">Waiting for attack results…</div>;
  return (
    <div className="surface overflow-hidden">
      <table className="data-table">
        <thead><tr><th>Result</th><th>Attack</th><th>Confidence</th><th aria-label="Open" /></tr></thead>
        <tbody>
          {attacks.map((attack) => (
            <tr key={attack.attack_id}>
              <td data-label="Result"><span className={`text-xs font-semibold ${attack.judge.succeeded ? "result-red" : "result-green"}`}>{attack.judge.succeeded ? "Breached" : "Blocked"}</span></td>
              <td data-label="Attack">
                <Link href={`/runs/${attack.run_id}/attacks/${attack.attack_id}${replay ? "?replay=1" : ""}`} className="font-medium capitalize text-zinc-200 hover:underline">{attack.attack_type.replaceAll("_", " ")}</Link>
                <span className="mt-0.5 block max-w-2xl truncate text-xs text-zinc-600">{attack.prompt}</span>
              </td>
              <td data-label="Confidence" className="mono text-xs">{Math.round(attack.judge.confidence * 100)}%</td>
              <td data-label="Open"><Link href={`/runs/${attack.run_id}/attacks/${attack.attack_id}${replay ? "?replay=1" : ""}`} aria-label={`Open ${attack.attack_type}`} className="text-zinc-600 hover:text-zinc-200">→</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
