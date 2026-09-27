"use client";

import { useState } from "react";

export default function ResponsibleAIDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-sm border border-cyan-400/30">
            ✓
          </span>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Responsible AI & Governance Disclosure</h4>
            <p className="text-xs text-slate-300">100% Policy Compliance · Bounded Sandbox Scope · Human Oversight</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-bold font-mono text-cyan-300 hover:text-cyan-200 underline shrink-0"
        >
          {open ? "Hide Governance Principles ▲" : "View Governance Principles ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-cyan-500/20 pt-4 text-sm text-slate-200 space-y-3 leading-relaxed animate-fade-in">
          <p>
            <strong className="text-cyan-300 font-bold">1. Authorized Bounded Scope:</strong> Gauntlet executes automated adversarial probes exclusively against explicitly authorized target endpoints in sandbox environments (e.g. <code className="text-cyan-300 font-mono font-bold bg-black/40 px-1.5 py-0.5 rounded">localhost:8001</code>).
          </p>
          <p>
            <strong className="text-cyan-300 font-bold">2. Data Privacy & Synthetic Payloads:</strong> Attack probes use 100% synthetic test scenarios. No real user data or PII is sent, exposed, or logged during testing pipelines.
          </p>
          <p>
            <strong className="text-cyan-300 font-bold">3. Human-in-the-Loop Oversight & Rule Fallbacks:</strong> AI judge verdicts produce transparent confidence ratings. Every RED gate decision can be audited by security engineers, backed up by deterministic rule-based checks.
          </p>
        </div>
      )}
    </div>
  );
}
