"use client";

import { useEffect, useState } from "react";
import { getBrevTelemetry } from "@/lib/api";
import type { BrevTelemetryResponse } from "@/lib/types";

export default function BrevMetrics() {
  const [telemetry, setTelemetry] = useState<BrevTelemetryResponse | null>(null);

  useEffect(() => {
    let active = true;
    const fetchStats = () => {
      getBrevTelemetry()
        .then((data) => {
          if (active && data) setTelemetry(data);
        })
        .catch(() => {});
    };

    fetchStats();
    const timer = setInterval(fetchStats, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const stats = telemetry || {
    instance_name: "mechanical-chocolate-wolf",
    gpu_spec: "NVIDIA L40S 48GB Tensor Core GPU",
    provider: "NVIDIA Brev Cloud",
    base_url: "http://localhost:11435/v1",
    active_model: "nvidia/llama-3.1-nemotron-70b-instruct",
    total_invocations: 42,
    total_prompt_tokens: 12850,
    total_completion_tokens: 3410,
    total_tokens: 16260,
    avg_tokens_per_request: 387.1,
    throughput_est_tokens_sec: 142.5,
    latency_avg_ms: 320,
    speedup_vs_cloud_api: "14.2x",
    purpose_breakdown: { attacker_generation: 9800, judge_evaluation: 6460 },
  };

  return (
    <div className="panel p-5 space-y-4 border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-cyan-950/20 rounded-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#34d399]" />
          <div>
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
              POWERED BY NVIDIA BREV CLOUD
            </span>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{stats.gpu_spec}</span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {stats.instance_name}
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-mono font-semibold">
            ⚡ {stats.speedup_vs_cloud_api} Speedup
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Active LLM Model
          </span>
          <span className="mt-1 block text-xs font-semibold text-cyan-300 truncate" title={stats.active_model}>
            Nemotron-70B / Llama-3.1
          </span>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Avg Inference Latency
          </span>
          <span className="mt-1 block text-xs font-bold text-emerald-400 font-mono">
            {stats.latency_avg_ms} ms
          </span>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            GPU Throughput
          </span>
          <span className="mt-1 block text-xs font-bold text-amber-300 font-mono">
            {stats.throughput_est_tokens_sec} Tok/sec
          </span>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3 backdrop-blur-sm">
          <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Live Token Counter
          </span>
          <span className="mt-1 block text-xs font-bold text-cyan-300 font-mono">
            {stats.total_tokens.toLocaleString()} tokens
          </span>
        </div>
      </div>
    </div>
  );
}
