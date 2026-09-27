"use client";

import { useState } from "react";

export default function ResponsibleAIDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs">
            ✓
          </span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Responsible AI & Governance Statement</h4>
            <p className="text-[11px] text-slate-400">100% Policy Compliance · Bounded Sandbox Scope · Human Oversight</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 underline"
        >
          {open ? "Hide Governance Principles" : "View Governance Principles"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-cyan-500/10 pt-3 text-xs text-slate-300 space-y-2 leading-relaxed animate-fade-in">
          <p>
            <strong className="text-cyan-200">1. Authorized Scope:</strong> Gauntlet executes automated adversarial tests strictly against authorized AI endpoints provided in local sandbox environments (e.g. <code className="text-cyan-300 font-mono">localhost:8001</code>).
          </p>
          <p>
            <strong className="text-cyan-200">2. Privacy & Synthetic Data:</strong> Attack generation payloads contain synthetic test scenarios only. Zero real user data or PII is exposed during pipeline runs.
          </p>
          <p>
            <strong className="text-cyan-200">3. Human-in-the-Loop & Deterministic Fallbacks:</strong> AI judge decisions produce structured confidence ratings. Every RED gate decision can be inspected by security engineers, backed up by deterministic rule-based checks.
          </p>
        </div>
      )}
    </div>
  );
}
