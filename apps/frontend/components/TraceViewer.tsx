import type { AttackRecord } from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-2 text-sm text-slate-200">{children}</dd>
    </div>
  );
}

export default function TraceViewer({ attack }: { attack: AttackRecord }) {
  return (
    <dl className="panel grid gap-6 p-5 sm:p-6">
      <Field label="Prompt">
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">{attack.prompt}</pre>
      </Field>
      <Field label="Target response">
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">{attack.target_response}</pre>
      </Field>
      <Field label="Tool calls">
        {attack.tool_calls.length ? (
          <div className="flex flex-wrap gap-2">
            {attack.tool_calls.map((t, i) => (
              <code key={i} className="rounded-lg border border-rose-300/10 bg-rose-400/[0.07] px-2.5 py-1.5 text-xs text-rose-200">{t}</code>
            ))}
          </div>
        ) : (
          <span className="text-slate-600">No tool calls observed</span>
        )}
      </Field>
      <Field label="Judge">
        <span className={`font-semibold ${attack.judge.succeeded ? "text-rose-300" : "text-emerald-300"}`}>
          {attack.judge.succeeded ? "Attack succeeded" : "Attack blocked"}
        </span>
        {attack.judge.violated_rule && <code className="ml-2 rounded bg-white/5 px-1.5 py-1 text-[11px] text-slate-400">{attack.judge.violated_rule}</code>}
        <p className="mt-2 leading-6 text-slate-400">{attack.judge.reasoning}</p>
      </Field>
      <div className="grid grid-cols-1 gap-5 border-t border-white/10 pt-5 sm:grid-cols-3">
        <Field label="Confidence">{attack.judge.confidence.toFixed(2)}</Field>
        <Field label="Timestamp">{attack.timestamp}</Field>
        <Field label="Trace ID"><code>{attack.trace_id}</code></Field>
      </div>
    </dl>
  );
}
