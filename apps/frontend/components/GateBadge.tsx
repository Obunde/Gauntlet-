export default function GateBadge({ gate }: { gate: "RED" | "GREEN" | null }) {
  if (!gate) {
    return (
      <div className="panel relative overflow-hidden px-7 py-9">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-400 animate-pulse" />
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <p className="eyebrow text-amber-300 font-mono">GATE EVALUATING</p>
        </div>
        <div className="mt-2 text-3xl font-black tracking-tight text-white">Testing release candidate…</div>
        <p className="mt-2 text-sm text-slate-400">Gauntlet is generating, executing, and judging adversarial attacks in Brev GPU sandbox.</p>
      </div>
    );
  }
  const red = gate === "RED";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-6 py-7 sm:px-8 transition-all duration-300 ${
        red
          ? "border-rose-500/30 bg-rose-500/[0.09] shadow-[0_0_40px_rgba(244,63,94,0.15)]"
          : "border-emerald-500/30 bg-emerald-500/[0.09] shadow-[0_0_40px_rgba(16,185,129,0.15)]"
      }`}
    >
      <div className={`absolute inset-y-0 left-0 w-2 ${red ? "bg-rose-500" : "bg-emerald-400"}`} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${red ? "bg-rose-400 shadow-[0_0_10px_#f43f5e]" : "bg-emerald-400 shadow-[0_0_10px_#34d399]"}`} />
            <div className={`text-xs font-mono font-bold uppercase tracking-[0.22em] ${red ? "text-rose-400" : "text-emerald-400"}`}>
              RELEASE GATE DECISION · {gate}
            </div>
          </div>
          <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            {red ? "RELEASE BLOCKED (Vulnerable Agent)" : "CLEAR TO SHIP (Protected Agent)"}
          </div>
          <p className="mt-2 text-sm text-slate-300 max-w-xl">
            {red
              ? "Critical policy breach detected. Adversarial test called forbidden delete_record tool."
              : "All security regression tests passed. No policy violations detected."}
          </p>
        </div>
        <div
          className={`grid h-24 w-24 shrink-0 place-items-center rounded-2xl border text-3xl font-black shadow-lg transition-transform duration-300 hover:scale-105 ${
            red
              ? "border-rose-400/30 bg-rose-500/20 text-rose-300 shadow-rose-900/30"
              : "border-emerald-400/30 bg-emerald-500/20 text-emerald-300 shadow-emerald-900/30"
          }`}
        >
          {red ? "RED" : "GREEN"}
        </div>
      </div>
    </div>
  );
}
