"use client";

// Owner: FE1
import { useEffect, useState } from "react";
import ReplayToggle from "@/components/ReplayToggle";
import RunButton from "@/components/RunButton";
import TargetGuardSwitch from "@/components/TargetGuardSwitch";
import BrevMetrics from "@/components/BrevMetrics";
import ResponsibleAIDisclosure from "@/components/ResponsibleAIDisclosure";
import { getPolicies } from "@/lib/api";

export default function Home() {
  const [policies, setPolicies] = useState<string[]>([]);
  const [policyId, setPolicyId] = useState("");
  const [targetUrl, setTargetUrl] = useState("http://localhost:8001/chat");
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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="status-pill"><i /> System ready</span>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Mock-safe · Brev-powered
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl">Run your AI through the gauntlet.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Generate adversarial attacks, capture the exact failure path, and turn every breach into a regression test before release.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="eyebrow">Release gate</p>
          <p className="mt-1 text-sm font-semibold text-slate-300">One decision. RED or GREEN.</p>
        </div>
      </header>

      {/* Target Security Guard Live Control */}
      <TargetGuardSwitch />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.75fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="eyebrow">New security run</p>
            <h2 className="mt-1 text-lg font-bold text-white">Configure an authorized target</h2>
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <label className="field-label">
              AI agent endpoint
              <input
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                className="field-control font-mono text-xs"
                placeholder="https://sandbox.example.com/chat"
                disabled={replay}
              />
              <span className="mt-2 block text-[11px] font-normal leading-5 text-slate-600">Gauntlet sends bounded POST requests only to this origin.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field-label">
                Security policy
                <select value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="field-control">
                  {policies.map((policy) => <option key={policy} value={policy}>{policy.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <div>
                <span className="field-label">Execution mode</span>
                <ReplayToggle value={replay} onChange={setReplay} />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3.5 text-xs leading-5 text-slate-400">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-cyan-300"
              />
              <span><strong className="block text-slate-200">Authorized testing confirmed</strong>I own this sandbox or have explicit permission to test it. The target contains synthetic data.</span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
              <p className="text-xs text-slate-600">2 active attack families · deterministic replay · ≤ 3 minutes</p>
              <RunButton policyId={policyId} targetUrl={targetUrl} replay={replay} authorized={authorized} />
            </div>
            {error && <p className="text-sm text-rose-300">Could not load policies: {error}</p>}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="panel p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Release pack</p>
              <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-bold text-cyan-200">2 ACTIVE</span>
            </div>
            <div className="mt-5 space-y-5">
              {[
                ["01", "Prompt injection", "Attempts to override policy and system instructions."],
                ["02", "Unauthorized actions", "Detects forbidden or unapproved tool execution."],
                ["NEXT", "Sensitive data", "PII and cross-user disclosure are the next policy pack."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-[10px] text-cyan-300">{number}</span>
                  <div><h3 className="text-sm font-semibold text-slate-200">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Brev GPU AI Telemetry Section */}
      <BrevMetrics />

      {/* Responsible AI Compliance Disclosure */}
      <ResponsibleAIDisclosure />

      <section className="panel grid gap-px overflow-hidden bg-white/10 md:grid-cols-4">
        {["Policy loaded", "Attacks generated", "Target exercised", "Gate decided"].map((label, index) => (
          <div key={label} className="bg-[#0d121d] px-5 py-4">
            <span className="font-mono text-[10px] text-cyan-400">0{index + 1}</span>
            <p className="mt-1 text-xs font-semibold text-slate-300">{label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
