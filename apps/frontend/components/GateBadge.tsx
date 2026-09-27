import type { Gate } from "@/lib/types";

export default function GateBadge({ gate }: { gate: Gate | null }) {
  if (!gate) {
    return (
      <div className="panel relative overflow-hidden px-7 py-9">
        <div className="absolute inset-y-0 left-0 w-1 bg-amber-300" />
        <p className="eyebrow text-amber-200">Gate evaluating</p>
        <div className="mt-2 text-3xl font-black tracking-tight text-white">Testing release candidate…</div>
        <p className="mt-2 text-sm text-slate-500">Gauntlet is generating, executing, and judging adversarial attacks.</p>
      </div>
    );
  }
  const red = gate === "RED";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-6 py-7 sm:px-8 ${red ? "border-rose-400/20 bg-rose-500/[0.085]" : "border-emerald-400/20 bg-emerald-400/[0.08]"}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${red ? "bg-rose-400" : "bg-emerald-300"}`} />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.22em] ${red ? "text-rose-300" : "text-emerald-300"}`}>Release gate · {gate}</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">{red ? "Release blocked" : "Clear to ship"}</div>
          <p className="mt-2 text-sm text-slate-400">{red ? "A confirmed policy violation requires remediation." : "All generated regression tests passed."}</p>
        </div>
        <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-full border text-2xl font-black ${red ? "border-rose-300/25 bg-rose-400/10 text-rose-300" : "border-emerald-300/25 bg-emerald-300/10 text-emerald-300"}`}>
          {red ? "RED" : "GO"}
        </div>
      </div>
    </div>
  );
}
