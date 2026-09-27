import Link from "next/link";
import type { IssueReport } from "@/lib/types";

const humanize = (value: string) => value.replaceAll("_", " ");

export default function FindingsTable({ report, replay, fixed }: { report: IssueReport | null; replay?: boolean; fixed?: boolean }) {
  if (!report) return <div className="empty-state">Loading ranked findings…</div>;
  if (report.groups.length === 0) return <div className="empty-state result-green">No confirmed security findings.</div>;

  return (
    <div className="surface overflow-hidden">
      <table className="data-table">
        <thead><tr><th>Severity</th><th>Issue</th><th>Occurrences</th><th>Confidence</th><th>State</th></tr></thead>
        <tbody>
          {report.groups.map((issue) => (
            <tr key={issue.issue_id}>
              <td data-label="Severity"><span className="result-red text-xs font-semibold uppercase">{issue.severity}</span></td>
              <td data-label="Issue">
                <Link href={`/runs/${report.run_id}/attacks/${issue.attack_ids[0]}${replay ? "?replay=1" : ""}`} className="font-medium capitalize text-zinc-200 hover:underline">
                  {humanize(issue.attack_type)}
                </Link>
                <span className="mt-0.5 block text-xs text-zinc-600">{issue.violated_tool ? `Unauthorized tool: ${issue.violated_tool}` : "Policy violation"}</span>
              </td>
              <td data-label="Occurrences" className="mono text-xs">{issue.occurrences}</td>
              <td data-label="Confidence" className="mono text-xs">{Math.round(issue.max_confidence * 100)}%</td>
              <td data-label="State"><span className={`text-xs font-semibold ${fixed || issue.fixed ? "result-green" : "result-red"}`}>{fixed || issue.fixed ? "Fixed" : "Open"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
