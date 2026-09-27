import type { AttackRecord } from "@/lib/types";

export default function TraceViewer({ attack }: { attack: AttackRecord }) {
  const steps = [
    { label: "Prompt", content: attack.prompt },
    { label: "Target response", content: attack.target_response },
    { label: "Tool calls", content: attack.tool_calls.length ? attack.tool_calls.join("\n") : "No tool calls observed" },
    { label: "Judge verdict", content: attack.judge.reasoning },
  ];

  return (
    <ol className="surface overflow-hidden">
      {steps.map((step, index) => (
        <li key={step.label} className="grid grid-cols-[28px_1fr] gap-3 border-b border-zinc-800 p-4 last:border-0 sm:p-5">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-zinc-700 bg-zinc-900 mono text-[10px] text-zinc-500">{index + 1}</span>
          <div className="min-w-0">
            <p className="section-label">{step.label}</p>
            <pre className={`mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 ${step.label === "Tool calls" && attack.tool_calls.length ? "result-red mono" : "text-zinc-300"}`}>{step.content}</pre>
          </div>
        </li>
      ))}
    </ol>
  );
}
