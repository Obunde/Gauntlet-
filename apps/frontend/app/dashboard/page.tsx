"use client";

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
    <div className="space-y-9 bg-slate-50 text-slate-900">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" /> System Ready
            </span>
            <span className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Mock-Safe · Brev GPU-Powered
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Run your AI through the gauntlet.
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Generate adversarial attacks, capture the exact failure path, and turn every breach into a regression test before release.
          </p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="eyebrow text-sky-700 font-extrabold">RELEASE GATE DECISION</p>
          <p className="mt-1 text-base font-bold text-slate-900">One Decision: RED or GREEN.</p>
        </div>
      </header>

      {/* Target Security Guard Live Control */}
      <TargetGuardSwitch />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
        <section className="panel overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="eyebrow text-sky-700 font-extrabold">New security run</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Configure an authorized target</h2>
          </div>
          <div className="space-y-6 p-6">
            <label className="field-label">
              <span className="block mb-1.5 font-bold text-slate-900">AI Agent Endpoint URL</span>
              <input
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                className="field-control font-mono text-sm"
                placeholder="https://sandbox.example.com/chat"
                disabled={replay}
              />
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
                Gauntlet sends bounded POST requests only to this authorized origin.
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="field-label">
                <span className="block mb-1.5 font-bold text-slate-900">Security Policy Pack</span>
                <select value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="field-control text-sm">
                  {policies.map((policy) => <option key={policy} value={policy}>{policy.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <div>
                <span className="field-label font-bold text-slate-900 block mb-1.5">Execution Mode</span>
                <div className="mt-1">
                  <ReplayToggle value={replay} onChange={setReplay} />
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 transition hover:bg-slate-100">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(event) => setAuthorized(event.target.checked)}
                className="mt-1 h-4 w-4 accent-sky-600 shrink-0"
              />
              <span>
                <strong className="block text-slate-900 font-bold">Authorized testing confirmed</strong>
                I own this sandbox endpoint or have explicit permission to test it. The target contains synthetic data.
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <p className="text-xs font-mono text-slate-500 font-bold">2 active attack families · deterministic replay · ≤ 3 minutes</p>
              <RunButton policyId={policyId} targetUrl={targetUrl} replay={replay} authorized={authorized} />
            </div>
            {error && <p className="text-sm text-rose-600 font-bold font-mono">Could not load policies: {error}</p>}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="panel p-6 border border-slate-200 bg-white rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <p className="eyebrow text-sky-700 font-extrabold">Active Release Pack</p>
              <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-xs font-extrabold text-sky-800">
                2 ACTIVE
              </span>
            </div>
            <div className="mt-5 space-y-5">
              {[
                ["01", "Prompt injection", "Attempts to override policy and system instructions."],
                ["02", "Unauthorized actions", "Detects forbidden or unapproved tool execution."],
                ["NEXT", "Sensitive data", "PII and cross-user disclosure are the next policy pack."],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4 items-start">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-300 bg-slate-100 font-mono text-xs font-bold text-sky-800 shadow-xs">{number}</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
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

      {/* Gauntlet Automated Security Pipeline 4-Step Breakdown */}
      <section className="panel space-y-4 border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="eyebrow text-sky-700 font-mono font-extrabold">AUTOMATED PIPELINE WORKFLOW</span>
            <h3 className="text-lg font-bold text-slate-900">Gauntlet Release Gate Execution Phases</h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-semibold">Deterministic & Audited</span>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            {
              step: "01",
              label: "Policy Loaded",
              icon: "📜",
              desc: "Parse YAML policies, target agent endpoints, and tool execution boundaries.",
              status: "✓ Config Validated",
            },
            {
              step: "02",
              label: "Attacks Generated",
              icon: "⚡",
              desc: "Synthesize OWASP LLM adversarial prompt injections on NVIDIA Brev GPUs.",
              status: "✓ GPU Synthesized",
            },
            {
              step: "03",
              label: "Target Exercised",
              icon: "🎯",
              desc: "Execute multi-turn probes against sandbox target & capture traces.",
              status: "✓ Traces Logged",
            },
            {
              step: "04",
              label: "Gate Decided",
              icon: "🚦",
              desc: "Issue RED (Blocked) or GREEN (Pass) verdict & auto-create Pytest suites.",
              status: "✓ Decision Issued",
            },
          ].map((item) => (
            <div key={item.step} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 hover:border-sky-300 transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">
                  PHASE {item.step}
                </span>
                <span className="text-lg">{item.icon}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{item.label}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.desc}</p>
              <div className="pt-2 text-[11px] font-mono text-emerald-700 font-bold border-t border-slate-200/80">
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
