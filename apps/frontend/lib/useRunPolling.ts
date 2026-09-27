"use client";

import { useEffect, useState } from "react";
import { getRun } from "./api";
import type { RunStatus } from "./types";

export function useRunPolling(runId: string, replay = false) {
  const [run, setRun] = useState<RunStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!runId) return;

    let active = true;
    let timer: NodeJS.Timeout;

    const fetchRun = async () => {
      try {
        const data = await getRun(runId, replay);
        if (!active) return;
        setRun(data);
        setError(null);

        // Keep polling if status is still pending or running
        if (data.status === "pending" || data.status === "running") {
          timer = setTimeout(fetchRun, 1000);
        }
      } catch (err) {
        if (!active) return;
        setError(String(err));
      }
    };

    fetchRun();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [runId, replay, attempt]);

  const retry = () => {
    setError(null);
    setRun(null);
    setAttempt((current) => current + 1);
  };

  return { run, error, retry };
}
