"use client";

import { useEffect, useState } from "react";
import { getRun } from "./api";
import type { RunStatus } from "./types";

/** Polls getRun every second until the run is done or errored. */
export function useRunPolling(runId: string, replay = false) {
  const [run, setRun] = useState<RunStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      try {
        const next = await getRun(runId, replay);
        if (cancelled) return;
        setRun(next);
        if (next.status !== "done" && next.status !== "error") timer = setTimeout(tick, 1000);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [runId, replay]);

  return { run, error };
}
