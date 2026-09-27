"use client";

import type { AttackRecord } from "@/lib/types";

export default function FailureClusters({ attacks }: { attacks: AttackRecord[] }) {
  const breached = attacks.filter((a) => a.judge.succeeded);

  if (breached.length === 0) {
    return (
      <div className="panel p-5 border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-300">
        <span className="font-bold">✓ Zero Failure Clusters:</span> No policy violations were detected in this run.
      </div>
    );
  }

  const clusters: Record<string, { count: number; example: AttackRecord; severity: string }> = {};

  breached.forEach((a) => {
    const key = a.judge.violated_rule || a.attack_type;
    if (!clusters[key]) {
      clusters[key] = {
        count: 0,
        example: a,
        severity: a.attack_type === "unauthorized_tool_action" ? "CRITICAL" : "HIGH",
      };
    }
    clusters[key].count += 1;
  });

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="eyebrow text-amber-400">SUPPLY CHAIN RISK CLUSTERING</span>
          <h3 className="mt-1 text-sm font-bold text-white">Failure Risk Clusters</h3>
        </div>
        <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-bold">
          {Object.keys(clusters).length} Clusters Detected
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(clusters).map(([rule, data]) => (
          <div key={rule} className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-rose-300">Violated Rule: {rule}</span>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded uppercase">
                {data.severity} ({data.count} occurrences)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              <span className="text-slate-500 font-mono">Example Probe:</span> &ldquo;{data.example.prompt}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
