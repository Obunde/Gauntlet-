"use client";

// Owner: FE1
import { useEffect, useState } from "react";
import ReplayToggle from "@/components/ReplayToggle";
import RunButton from "@/components/RunButton";
import { getPolicies } from "@/lib/api";

export default function Home() {
  const [policies, setPolicies] = useState<string[]>([]);
  const [policyId, setPolicyId] = useState("");
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
      <div>
        <h1 className="text-5xl font-black tracking-tight">Gauntlet</h1>
        <p className="mt-2 text-neutral-400">Red-team your AI agent before it ships. One gate: RED or GREEN.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-800 p-6">
        <label className="block text-sm text-neutral-400">
          Policy
          <select
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100"
          >
            {policies.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <ReplayToggle value={replay} onChange={setReplay} />
        <RunButton policyId={policyId} replay={replay} />
        {error && <p className="text-sm text-red-400">Could not load policies: {error}</p>}
      </div>
      {/* TODO(FE1): target URL input and a list of recent runs. */}
    </div>
  );
}
