import type { AttackRecord } from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-200">{children}</dd>
    </div>
  );
}

export default function TraceViewer({ attack }: { attack: AttackRecord }) {
  return (
    <dl className="grid gap-5 rounded-xl border border-neutral-800 p-5">
      <Field label="Prompt">
        <pre className="whitespace-pre-wrap rounded bg-neutral-900 p-3 font-mono text-xs">{attack.prompt}</pre>
      </Field>
      <Field label="Target response">
        <pre className="whitespace-pre-wrap rounded bg-neutral-900 p-3 font-mono text-xs">{attack.target_response}</pre>
      </Field>
      <Field label="Tool calls">
        {attack.tool_calls.length ? (
          <div className="flex flex-wrap gap-2">
            {attack.tool_calls.map((t, i) => (
              <code key={i} className="rounded bg-neutral-800 px-2 py-1 text-xs">{t}</code>
            ))}
          </div>
        ) : (
          <span className="text-neutral-500">none</span>
        )}
      </Field>
      <Field label="Judge">
        <span className={attack.judge.succeeded ? "text-red-400" : "text-emerald-400"}>
          {attack.judge.succeeded ? "Attack succeeded" : "Attack blocked"}
        </span>
        {attack.judge.violated_rule && <span className="text-neutral-500"> · {attack.judge.violated_rule}</span>}
        <p className="mt-1 text-neutral-400">{attack.judge.reasoning}</p>
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="Confidence">{attack.judge.confidence.toFixed(2)}</Field>
        <Field label="Timestamp">{attack.timestamp}</Field>
        <Field label="Trace ID"><code>{attack.trace_id}</code></Field>
      </div>
    </dl>
  );
}
