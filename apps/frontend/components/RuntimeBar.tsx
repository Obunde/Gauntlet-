"use client";

import { useEffect, useState } from "react";
import { getBrevTelemetry, getHealth } from "@/lib/api";
import type { BrevTelemetryResponse, HealthResponse } from "@/lib/types";

const compactModel = (model: string) => model.split("/").at(-1) ?? model;

export default function RuntimeBar() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [telemetry, setTelemetry] = useState<BrevTelemetryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getHealth(), getBrevTelemetry()]).then(([healthResult, telemetryResult]) => {
      if (healthResult.status === "fulfilled") setHealth(healthResult.value);
      if (telemetryResult.status === "fulfilled") setTelemetry(telemetryResult.value);
      setLoading(false);
    });
  }, []);

  return (
    <details className="surface group">
      <summary className="flex min-h-11 items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
          <span className="flex items-center gap-2 text-zinc-300">
            <i className={`status-dot ${health?.pipeline_ready ? "" : "neutral"}`} />
            {loading ? "Checking runtime" : health?.pipeline_ready ? `${health.mode} pipeline ready` : "Runtime unavailable"}
          </span>
          {telemetry ? (
            <>
              <span>{telemetry.provider}</span>
              <span className="hide-mobile">{telemetry.gpu_spec}</span>
              <span className="hide-mobile mono">{compactModel(telemetry.active_model)}</span>
              <span>{Math.round(telemetry.latency_avg_ms)} ms</span>
              <span>{telemetry.total_tokens.toLocaleString()} tokens</span>
            </>
          ) : !loading ? <span>Telemetry unavailable</span> : null}
        </div>
        <span className="shrink-0 text-xs text-zinc-600 group-open:rotate-180" aria-hidden>⌄</span>
      </summary>
      <div className="grid gap-4 border-t border-zinc-800 px-4 py-4 text-xs sm:grid-cols-3">
        <div><p className="section-label">Provider</p><p className="mt-1.5 text-zinc-300">{telemetry?.provider ?? "Unavailable"}</p></div>
        <div><p className="section-label">Active model</p><p className="mt-1.5 break-all text-zinc-300">{telemetry?.active_model ?? "Unavailable"}</p></div>
        <div><p className="section-label">Workload</p><p className="mt-1.5 text-zinc-300">{telemetry ? `${telemetry.total_invocations} invocations · ${telemetry.throughput_est_tokens_sec} tokens/s` : "Unavailable"}</p></div>
      </div>
    </details>
  );
}
