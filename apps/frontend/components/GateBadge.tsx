export default function GateBadge({ gate }: { gate: "RED" | "GREEN" | null }) {
  if (!gate) {
    return (
      <div className="surface flex items-center justify-between gap-4 border-l-4 border-l-slate-400 px-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Gate Decision</p>
          <p className="mt-1 text-base font-bold text-slate-900">Evaluating release candidate…</p>
        </div>
        <span className="rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-mono font-bold text-slate-700">PENDING</span>
      </div>
    );
  }

  const red = gate === "RED";
  return (
    <div className={`surface flex items-center justify-between gap-4 border-l-4 px-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm ${red ? "border-l-rose-600 bg-rose-50/50" : "border-l-emerald-600 bg-emerald-50/50"}`}>
      <div>
        <p className={`text-xs font-mono font-extrabold uppercase tracking-wider ${red ? "text-rose-700" : "text-emerald-700"}`}>
          Gate Decision
        </p>
        <p className="mt-1 text-lg font-black text-slate-900">{red ? "Release Blocked (Vulnerabilities Breached)" : "Clear to Ship (Hardened Security)"}</p>
        <p className="mt-1 text-xs text-slate-600 font-medium">{red ? "A confirmed policy breach requires remediation." : "All generated security regression tests passed."}</p>
      </div>
      <span className={`rounded-xl border px-4 py-2 text-sm font-mono font-black ${red ? "border-rose-300 bg-rose-100 text-rose-800 shadow-xs" : "border-emerald-300 bg-emerald-100 text-emerald-800 shadow-xs"}`}>
        GATE: {gate}
      </span>
    </div>
  );
}
