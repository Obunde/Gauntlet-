import Link from "next/link";
import type { IssueReport } from "@/lib/types";

const humanize = (value: string) => value.replaceAll("_", " ");

export default function FindingsTable({
  report,
  replay,
  fixed,
}: {
  report: IssueReport | null;
  replay?: boolean;
  fixed?: boolean;
}) {
  if (!report)
    return <div className="panel p-6 text-center text-xs font-mono font-bold text-slate-500 bg-white rounded-2xl">Loading ranked findings…</div>;
  if (report.groups.length === 0)
    return <div className="panel p-6 text-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50/50 border-emerald-200 rounded-2xl">✓ No confirmed security findings.</div>;

  return (
    <div className="panel overflow-hidden p-0 border border-slate-200 bg-white rounded-2xl shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono font-extrabold uppercase text-slate-600">
            <th className="px-5 py-3.5">Severity</th>
            <th className="px-5 py-3.5">Issue</th>
            <th className="px-5 py-3.5">Occurrences</th>
            <th className="px-5 py-3.5">Confidence</th>
            <th className="px-5 py-3.5">State</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {report.groups.map((issue) => (
            <tr key={issue.issue_id} className="hover:bg-sky-50/50 transition-colors">
              <td className="px-5 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                  {issue.severity}
                </span>
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`/runs/${report.run_id}/attacks/${issue.attack_ids[0]}${replay ? "?replay=1" : ""}`}
                  className="font-bold capitalize text-slate-900 hover:text-sky-700 hover:underline text-sm"
                >
                  {humanize(issue.attack_type)}
                </Link>
                <span className="mt-1 block text-xs text-slate-600 font-medium">
                  {issue.violated_tool ? `Unauthorized tool: ${issue.violated_tool}` : "Policy violation"}
                </span>
              </td>
              <td className="px-5 py-4 font-mono font-bold text-slate-900">{issue.occurrences}</td>
              <td className="px-5 py-4 font-mono font-bold text-slate-900">{Math.round(issue.max_confidence * 100)}%</td>
              <td className="px-5 py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold uppercase border ${
                    fixed || issue.fixed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {fixed || issue.fixed ? "Fixed" : "Open"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
