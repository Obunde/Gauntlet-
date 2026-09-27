import type { AttackRecord } from "@/lib/types";

export default function TraceViewer({ attack }: { attack: AttackRecord }) {
  const steps = [
    { label: "Prompt", content: attack.prompt },
    { label: "Target response", content: attack.target_response },
    { label: "Tool calls", content: attack.tool_calls.length ? attack.tool_calls.join("\n") : "No tool calls observed" },
    { label: "Judge verdict", content: attack.judge.reasoning },
  ];

  return (
    <ol className="panel overflow-hidden p-0 border border-slate-200 bg-white rounded-2xl shadow-xs divide-y divide-slate-200">
      {steps.map((step, index) => (
        <li key={step.label} className="grid grid-cols-[36px_1fr] gap-4 p-5 sm:p-6 bg-white hover:bg-slate-50/50 transition-colors">
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-sky-200 bg-sky-50 mono text-xs font-bold text-sky-800 shadow-2xs">
            {index + 1}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="eyebrow text-sky-700 font-mono font-extrabold">{step.label}</p>
            <pre
              className={`whitespace-pre-wrap break-words font-mono text-xs leading-relaxed p-3.5 rounded-xl border ${
                step.label === "Tool calls" && attack.tool_calls.length
                  ? "bg-rose-50 text-rose-900 border-rose-200 font-bold"
                  : "bg-slate-50 text-slate-900 border-slate-200 font-semibold"
              }`}
            >
              {step.content}
            </pre>
          </div>
        </li>
      ))}
    </ol>
  );
}
