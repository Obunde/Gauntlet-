"use client";

import { useEffect, useState } from "react";
import ReplayToggle from "@/components/ReplayToggle";
import RunButton from "@/components/RunButton";
import RuntimeBar from "@/components/RuntimeBar";
import { getPolicies } from "@/lib/api";

const presets = [
  { id: "customer_support", name: "Customer support", detail: "PII, prompt injection, tool misuse" },
  { id: "financial_agent", name: "Financial agent", detail: "Transactions, authorization, data access" },
];

const humanize = (value: string) => value.replaceAll("_", " ").replace(/^./, (char) => char.toUpperCase());

export default function Home() {
  const [policies, setPolicies] = useState<string[]>([]);
  const [policyId, setPolicyId] = useState("customer_support");
  const [targetUrl, setTargetUrl] = useState("http://localhost:8001/chat");
  const [authorized, setAuthorized] = useState(true);
  const [replay, setReplay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPolicies()
      .then((available) => {
        setPolicies(available);
        if (!available.includes(policyId)) setPolicyId(available[0] ?? "");
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="pb-2">
        <p className="section-label">AI security testing</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-zinc-50 sm:text-4xl">Find what your agent exposes.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Run adversarial tests against an authorized AI endpoint and turn every breach into a regression test.</p>
      </header>

      <section className="surface overflow-hidden" aria-labelledby="scan-heading">
        <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
          <h2 id="scan-heading" className="text-sm font-semibold text-zinc-100">Configure scan</h2>
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <fieldset>
            <legend className="field-label">Preset</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={policyId === preset.id}
                  onClick={() => setPolicyId(preset.id)}
                  className={`rounded-lg border p-3 text-left transition ${policyId === preset.id ? "border-zinc-500 bg-zinc-800/70" : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700"}`}
                >
                  <span className="block text-sm font-medium text-zinc-200">{preset.name}</span>
                  <span className="mt-1 block text-xs text-zinc-500">{preset.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label>
            <span className="field-label">Target URL</span>
            <input
              type="url"
              value={targetUrl}
              onChange={(event) => setTargetUrl(event.target.value)}
              className="field-control mono text-xs"
              placeholder="https://sandbox.example.com/chat"
              disabled={replay}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className="field-label">Policy</span>
              <select value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="field-control">
                {policies.map((policy) => <option key={policy} value={policy}>{humanize(policy)}</option>)}
              </select>
            </label>
            <div>
              <span className="field-label">Mode</span>
              <ReplayToggle value={replay} onChange={setReplay} />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 border-t border-zinc-800 pt-5 text-xs leading-5 text-zinc-500">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(event) => setAuthorized(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-zinc-100"
            />
            <span>I confirm I own this sandbox or have explicit permission to test it.</span>
          </label>

          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-zinc-600">{replay ? "Uses a deterministic recorded run." : "Tests the configured endpoint with bounded requests."}</p>
            <RunButton policyId={policyId} targetUrl={targetUrl} replay={replay} authorized={authorized} />
          </div>
          {error && <p role="alert" className="text-xs result-red">Policies unavailable: {error}</p>}
        </div>
      </section>

      <RuntimeBar />
      <footer className="flex items-center justify-center gap-2 pt-2 text-xs text-zinc-600"><span aria-hidden>⌁</span> Authorized sandbox only</footer>
    </div>
  );
}
