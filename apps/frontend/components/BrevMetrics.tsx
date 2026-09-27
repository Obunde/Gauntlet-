export default function BrevMetrics() {
  return (
    <div className="panel p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="eyebrow text-cyan-400 font-mono">NVIDIA BREV GPU ENGINE TELEMETRY</span>
          <h3 className="mt-1 text-lg font-bold text-white">AI Inference & Compute Telemetry</h3>
        </div>
        <span className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          Brev Pod Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="block text-xs font-mono font-bold text-slate-400 uppercase">Attacker LLM</span>
          <span className="mt-1.5 block text-sm font-bold text-cyan-200 truncate">Llama-3-70B (Brev)</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="block text-xs font-mono font-bold text-slate-400 uppercase">Judge LLM</span>
          <span className="mt-1.5 block text-sm font-bold text-cyan-200 truncate">Mistral-Instruct (Brev)</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="block text-xs font-mono font-bold text-slate-400 uppercase">Avg Latency</span>
          <span className="mt-1.5 block text-sm font-bold text-emerald-300 font-mono">1.42s / attack</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <span className="block text-xs font-mono font-bold text-slate-400 uppercase">Token Telemetry</span>
          <span className="mt-1.5 block text-sm font-bold text-amber-300 font-mono">1,840 tokens</span>
        </div>
      </div>
    </div>
  );
}
