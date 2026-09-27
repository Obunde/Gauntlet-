"use client";

// Owner: FE1
import { useEffect, useState } from "react";
import ReplayToggle from "@/components/ReplayToggle";
import RunButton from "@/components/RunButton";
import TargetGuardSwitch from "@/components/TargetGuardSwitch";
import BrevMetrics from "@/components/BrevMetrics";
import ResponsibleAIDisclosure from "@/components/ResponsibleAIDisclosure";
import LiveAgentChatTester from "@/components/LiveAgentChatTester";
import { getPolicies } from "@/lib/api";

export default function DashboardPage() {
  const [policies, setPolicies] = useState<string[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [targetUrl, setTargetUrl] = useState(process.env.NEXT_PUBLIC_TARGET_URL || "http://localhost:8001/chat");
  const [authorized, setAuthorized] = useState(true);
  const [replay, setReplay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies()
      .then((p) => {
        setPolicies(p);
        setPolicyId(p[0] ?? "");
      })
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="space-y-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="status-pill text-xs"><i /> System ready</span>
            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 shadow-[0_0_15px_rgba(103,232,249,0.1)]">
              Mock-safe · Brev-powered
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Run your AI through the gauntlet.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Generate adversarial attacks, capture the exact failure path, and turn every breach into a regression test before release.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="eyebrow text-cyan-400">Release gate</p>
          <p className="mt-1 text-base font-bold text-slate-200">One decision. RED or GREEN.</p>
        </div>
      </header>

      {/* Target Security Guard Live Control */}
      <TargetGuardSwitch />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="eyebrow">New security run</p>
            <h2 className="mt-1 text-xl font-bold text-white">Configure an authorized target</h2>
          </div>
          <div className="space-y-6 p-6">
            <label className="field-label">
              AI agent endpoint
              <input
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                className="field-control font-mono text-sm"
                placeholder="https://sandbox.example.com/chat"
                disabled={replay}
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-400">
                Gauntlet sends bounded POST requests only to this origin.
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="field-label">
                Security policy
                <select value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="field-control text-sm">
                  {policies.map((policy) => <option key={policy} value={policy}>{policy.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <div>
                <span className="field-label">Execution mode</span>
                <div className="mt-2">
                  <ReplayToggle value={replay} onChange={setReplay} />
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300 transition hover:bg-white/[0.05]">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-1 h-4 w-4 accent-cyan-300 shrink-0"
              />
              <span>
                <strong className="block text-slate-100 font-bold">Authorized testing confirmed</strong>
                I own this sandbox or have explicit permission to test it. The target contains synthetic data.
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <p className="text-xs font-mono text-slate-400">2 active attack families · deterministic replay · ≤ 3 minutes</p>
              <RunButton policyId={policyId} targetUrl={targetUrl} replay={replay} authorized={authorized} />
            </div>
            {error && <p className="text-sm text-rose-300">Could not load policies: {error}</p>}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Release pack</p>
              <span className="rounded-full bg-cyan-300/10 border border-cyan-300/20 px-3 py-1 text-xs font-bold text-cyan-200">
                2 ACTIVE
              </span>
            </div>
            <div className="mt-6 space-y-6">
              {[
                ["01", "Prompt injection", "Attempts to override policy and system instructions."],
                ["02", "Unauthorized actions", "Detects forbidden or unapproved tool execution."],
                ["NEXT", "Sensitive data", "PII and cross-user disclosure are the next policy pack."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.04] font-mono text-xs font-bold text-cyan-300 shadow-sm">{number}</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Interactive Live Agent Chat Tester */}
      <LiveAgentChatTester targetUrl={targetUrl} />

      {/* Brev GPU AI Telemetry Section */}
      <BrevMetrics />

      {/* Responsible AI Compliance Disclosure */}
      <ResponsibleAIDisclosure />

      <section className="panel grid gap-px overflow-hidden bg-white/10 md:grid-cols-4">
        {["Policy loaded", "Attacks generated", "Target exercised", "Gate decided"].map((label, index) => (
          <div key={label} className="bg-[#0d121d] px-6 py-5">
            <span className="font-mono text-xs font-bold text-cyan-400">0{index + 1}</span>
            <p className="mt-1 text-sm font-bold text-slate-200">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
