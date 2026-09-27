"use client";

import { useState } from "react";

export default function ResponsibleAIDisclosure() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900 to-emerald-950/30 p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-base border border-cyan-400/30 shadow-[0_0_15px_rgba(103,232,249,0.2)]">
            🛡️
          </span>
          <div>
            <h4 className="text-base font-bold text-white uppercase tracking-wider">Responsible AI, Governance & Credits Disclosure</h4>
            <p className="text-xs text-slate-300">NVIDIA Brev Cloud Infrastructure · OWASP Compliance · Bounded Sandbox Execution</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs font-bold font-mono text-cyan-300 hover:text-cyan-200 underline shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 transition-all cursor-pointer"
        >
          {open ? "Hide Governance & Credits ▲" : "View Governance & Credits ▼"}
        </button>
      </div>

      {open && (
        <div className="mt-5 space-y-5 text-xs leading-relaxed animate-fade-in text-slate-200">
          {/* Section 1: Hackathon Credits & Technology Attributions */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block tracking-wider">
              1. Platform Infrastructure & Hackathon Credits
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 font-mono block">GPU Inference Partner</span>
                <strong className="text-cyan-300 font-bold block mt-0.5">NVIDIA Brev Cloud</strong>
                <span className="text-[10px] text-slate-400 font-mono">Instance: mechanical-chocolate-wolf (L40S 48GB)</span>
              </div>
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 font-mono block">Active Red-Team LLM</span>
                <strong className="text-emerald-300 font-bold block mt-0.5">Qwen 2.5 Coder / Nemotron 70B</strong>
                <span className="text-[10px] text-slate-400 font-mono">Parallel OWASP Probe Synthesis</span>
              </div>
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 font-mono block">Security Framework</span>
                <strong className="text-amber-300 font-bold block mt-0.5">OWASP Top 10 for LLM Apps</strong>
                <span className="text-[10px] text-slate-400 font-mono">Prompt Injection & Tool Invocation Guard</span>
              </div>
            </div>
          </div>

          {/* Section 2: Governance & Safety Rules */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase block tracking-wider">
              2. Responsible AI & Bounded Sandbox Safety
            </span>
            <p>
              <strong className="text-cyan-300 font-bold">Authorized Bounded Scope:</strong> Gauntlet executes automated adversarial probes exclusively against explicitly authorized target endpoints in isolated sandbox environments (e.g. <code className="text-cyan-300 font-mono font-bold bg-black/50 px-1.5 py-0.5 rounded border border-cyan-500/30">localhost:8001</code>).
            </p>
            <p>
              <strong className="text-cyan-300 font-bold">Data Privacy & Synthetic Scenarios:</strong> Attack probes use 100% synthetic test scenarios. No real user data or PII is sent, exposed, or logged during testing pipelines.
            </p>
            <p>
              <strong className="text-cyan-300 font-bold">Human-in-the-Loop Oversight:</strong> AI judge verdicts produce transparent confidence ratings. Every RED gate decision can be audited by security engineers, backed up by deterministic rule-based checks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

