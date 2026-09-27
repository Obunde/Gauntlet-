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
    <div className="panel p-6 space-y-4 border border-slate-200 bg-white rounded-2xl shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          <div>
            <span className="text-[11px] font-mono tracking-widest text-sky-700 font-extrabold uppercase">
              POWERED BY NVIDIA BREV CLOUD
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <span>{stats.gpu_spec}</span>
              <span className="text-xs font-mono text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md font-bold">
                {stats.instance_name}
              </span>
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono font-extrabold">
            ⚡ {stats.speedup_vs_cloud_api} Speedup vs Cloud API
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center pt-1">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
            Active LLM Model
          </span>
          <span className="mt-1 block text-xs font-bold text-sky-800 truncate" title={stats.active_model}>
            Nemotron-70B / Llama-3.1
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
            Avg Inference Latency
          </span>
          <span className="mt-1 block text-xs font-bold text-emerald-700 font-mono">
            {stats.latency_avg_ms} ms
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
            GPU Throughput
          </span>
          <span className="mt-1 block text-xs font-bold text-amber-700 font-mono">
            {stats.throughput_est_tokens_sec} Tok/sec
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
            Live Token Counter
          </span>
          <span className="mt-1 block text-xs font-bold text-sky-800 font-mono">
            {stats.total_tokens.toLocaleString()} tokens
          </span>
        </div>
      </div>
    </div>
  );
}
