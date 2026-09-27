export default function GateBadge({ gate }: { gate: "RED" | "GREEN" | null }) {
  if (!gate) {
    return (
      <div className="surface flex items-center justify-between gap-4 border-l-2 border-l-zinc-500 px-5 py-4">
        <div><p className="section-label">Gate decision</p><p className="mt-1 text-sm font-medium text-zinc-300">Evaluating release candidate…</p></div>
        <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-500">PENDING</span>
      </div>
    );
  }

  const red = gate === "RED";
  return (
    <div className={`surface flex items-center justify-between gap-4 border-l-2 px-5 py-4 ${red ? "border-l-red-400 bg-red-500/[0.035]" : "border-l-green-400 bg-green-500/[0.035]"}`}>
      <div>
        <p className={`section-label ${red ? "result-red" : "result-green"}`}>Gate decision</p>
        <p className="mt-1 text-base font-semibold text-zinc-100">{red ? "Release blocked" : "Clear to ship"}</p>
        <p className="mt-1 text-xs text-zinc-500">{red ? "A confirmed policy breach requires remediation." : "All generated security regression tests passed."}</p>
      </div>
      <span className={`rounded-md border px-3 py-1.5 text-xs font-bold ${red ? "border-red-400/30 bg-red-500/10 result-red" : "border-green-400/30 bg-green-500/10 result-green"}`}>{gate}</span>
    </div>
  );
}
