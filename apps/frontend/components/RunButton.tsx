"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startRun } from "@/lib/api";
import recorded from "@/mocks/run_mock.json";

export default function RunButton({ policyId, replay }: { policyId: string; replay: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      if (replay) {
        router.push(`/runs/${recorded.run_id}?replay=1`);
        return;
      }
      const { run_id } = await startRun(policyId);
      router.push(`/runs/${run_id}`);
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={busy || !policyId}
        className="rounded-lg bg-white px-6 py-3 font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {busy ? "Starting…" : replay ? "Replay recorded run" : "Run Gauntlet"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
