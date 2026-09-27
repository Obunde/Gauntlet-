"use client";

import { useState } from "react";
import { regress, setTargetGuard } from "@/lib/api";
import type { RegressResponse } from "@/lib/types";

type Phase = "idle" | "guard" | "regress" | "success" | "error";

export default function RemediationPanel({ runId, disabled, onComplete }: { runId: string; disabled: boolean; onComplete: (result: RegressResponse) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [guardEnabled, setGuardEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const remediate = async () => {
    setMessage(null);
    try {
      setPhase("guard");
      const guard = await setTargetGuard(true);
      setGuardEnabled(guard.enabled);
      if (!guard.enabled) throw new Error("The target guard did not enable.");
      setPhase("regress");
      const result = await regress(runId);
      onComplete(result);
      if (result.gate !== "GREEN") throw new Error("Regression tests still report an open breach.");
      setPhase("success");
      setMessage("Guard enabled. All generated regression tests passed.");
    } catch (cause) {
      setPhase("error");
      setMessage(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const setGuard = async (enabled: boolean) => {
    setMessage(null);
    try {
      const response = await setTargetGuard(enabled);
      setGuardEnabled(response.enabled);
      setMessage(`Target guard ${response.enabled ? "enabled" : "disabled"}.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const busy = phase === "guard" || phase === "regress";
  return (
    <section className="surface p-5 sm:p-6" aria-labelledby="remediation-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="section-label">Remediation</p>
          <h2 id="remediation-heading" className="mt-1.5 text-base font-semibold text-zinc-100">Harden target and verify the fix</h2>
          <p className="mt-1 text-xs text-zinc-500">Enables the target guard, then runs the generated regression suite.</p>
        </div>
        <button className="primary-button shrink-0" disabled={disabled || busy || phase === "success"} onClick={remediate}>
          {phase === "guard" ? "Enabling guard…" : phase === "regress" ? "Running regressions…" : phase === "success" ? "Remediated" : phase === "error" ? "Retry remediation" : "Quick remediate"}
        </button>
      </div>
      {message && <p role={phase === "error" ? "alert" : undefined} className={`mt-4 border-t border-zinc-800 pt-4 text-xs ${phase === "error" ? "result-red" : phase === "success" ? "result-green" : "text-zinc-400"}`}>{message}</p>}
      <details className="mt-4 border-t border-zinc-800 pt-4">
        <summary className="flex items-center justify-between text-xs text-zinc-500 hover:text-zinc-300"><span>Advanced guard control</span><span aria-hidden>⌄</span></summary>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
          <span className="flex items-center gap-2 text-xs text-zinc-400"><i className={`status-dot ${guardEnabled ? "" : "danger"}`} /> Guard {guardEnabled ? "enabled" : "disabled"}</span>
          <button className="secondary-button min-h-8 py-1.5 text-xs" onClick={() => setGuard(!guardEnabled)} disabled={busy}>{guardEnabled ? "Disable guard" : "Enable guard"}</button>
        </div>
      </details>
    </section>
  );
}
