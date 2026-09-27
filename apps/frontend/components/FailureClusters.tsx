import type { AttackRecord } from "@/lib/types";

export default function FailureClusters({ attacks }: { attacks: AttackRecord[] }) {
  const breachedAttacks = attacks.filter((a) => a.judge.succeeded);

  // Group by violated_rule or attack_type
  const clustersMap = new Map<string, { count: number; maxConfidence: number; rule: string; type: string; samplePrompt: string }>();

  breachedAttacks.forEach((attack) => {
    const key = attack.judge.violated_rule ?? attack.attack_type;
    const existing = clustersMap.get(key);
    if (existing) {
      existing.count += 1;
      existing.maxConfidence = Math.max(existing.maxConfidence, attack.judge.confidence);
    } else {
      clustersMap.set(key, {
        count: 1,
        maxConfidence: attack.judge.confidence,
        rule: attack.judge.violated_rule ?? "Unspecified Rule",
        type: attack.attack_type,
        samplePrompt: attack.prompt,
      });
    }
  });

  const clusters = Array.from(clustersMap.values()).sort((a, b) => b.count - a.count || b.maxConfidence - a.maxConfidence);

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="eyebrow text-cyan-400">SUPPLYZPRO PRIZE · HIDDEN FAILURE CLUSTERS</span>
          <h3 className="mt-1 text-base font-bold text-white">Risk Priority & Failure Grouping</h3>
        </div>
        <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-mono text-rose-300 font-bold">
          {breachedAttacks.length} Total Breaches
        </span>
      </div>

      {clusters.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">No recurring failure clusters detected. Agent complies with security policy.</p>
      ) : (
        <div className="space-y-3">
          {clusters.map((cluster, idx) => (
            <div key={idx} className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded">
                    PRIORITY #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-200 uppercase">{cluster.type.replaceAll("_", " ")}</span>
                  <span className="font-mono text-[11px] text-slate-400">({cluster.rule})</span>
                </div>
                <span className="font-mono font-bold text-amber-300">
                  Risk Score: {Math.round(cluster.maxConfidence * 100 * cluster.count)} pts
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate font-mono bg-black/30 p-2 rounded">
                Sample: "{cluster.samplePrompt}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Occurrences: <strong className="text-white">{cluster.count}x</strong></span>
                <span>Max Judge Confidence: <strong className="text-emerald-300">{Math.round(cluster.maxConfidence * 100)}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
