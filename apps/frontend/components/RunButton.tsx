"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { startRun } from "@/lib/api";
import recorded from "@/mocks/run_mock.json";

export default function RunButton({
  policyId,
  targetUrl,
  replay,
  authorized,
}: {
  policyId: string;
  targetUrl: string;
  replay: boolean;
  authorized: boolean;
}) {
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
      const { run_id } = await startRun(policyId, targetUrl || undefined);
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
        disabled={busy || !policyId || !authorized || (!replay && !targetUrl)}
        className="primary-button"
      >
        <span>{busy ? "Starting…" : replay ? "Replay recorded run" : "Run security scan"}</span>
        {!busy && <span aria-hidden>→</span>}
      </button>
      {error && <p className="mt-2 max-w-sm text-xs text-rose-300">{error}</p>}
    </div>
  );
}
