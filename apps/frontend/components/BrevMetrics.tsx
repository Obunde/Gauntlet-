export default function BrevMetrics() {
  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <span className="eyebrow text-cyan-400">NVIDIA BREV GPU ENGINE</span>
          <h3 className="mt-1 text-sm font-bold text-white">AI Inference & Token Telemetry</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          Brev Pod Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <span className="block text-[10px] text-slate-500 uppercase font-mono">Attacker Model</span>
          <span className="mt-1 block text-xs font-semibold text-cyan-200 truncate">Llama-3-70B (Brev)</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <span className="block text-[10px] text-slate-500 uppercase font-mono">Judge Model</span>
          <span className="mt-1 block text-xs font-semibold text-cyan-200 truncate">Mistral-Instruct (Brev)</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <span className="block text-[10px] text-slate-500 uppercase font-mono">Avg Latency</span>
          <span className="mt-1 block text-xs font-semibold text-emerald-300 font-mono">1.42s / attack</span>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <span className="block text-[10px] text-slate-500 uppercase font-mono">Token Telemetry</span>
          <span className="mt-1 block text-xs font-semibold text-amber-300 font-mono">1,840 tokens</span>
        </div>
      </div>
    </div>
  );
}
