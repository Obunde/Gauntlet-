import type { Gate } from "@/lib/types";

export default function GateBadge({ gate }: { gate: Gate | null }) {
  if (!gate) {
    return (
      <div className="rounded-2xl border border-neutral-800 px-8 py-10 text-center text-4xl font-bold text-neutral-500">
        EVALUATING…
      </div>
    );
  }
  const red = gate === "RED";
  return (
    <div
      className={`rounded-2xl px-8 py-10 text-center ${red ? "bg-red-600/90 shadow-red-900/50" : "bg-emerald-600/90 shadow-emerald-900/50"} shadow-2xl`}
    >
      <div className="text-sm font-semibold uppercase tracking-[0.3em] opacity-80">Gate: {gate}</div>
      <div className="mt-2 text-5xl font-black tracking-tight sm:text-7xl">{red ? "CANNOT SHIP" : "CLEAR TO SHIP"}</div>
    </div>
  );
}
