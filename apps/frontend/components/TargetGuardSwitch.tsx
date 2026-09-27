"use client";

import { useState } from "react";
import { setTargetGuard } from "@/lib/api";

export default function TargetGuardSwitch() {
  const [hardened, setHardened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggleGuard = async (newHardened: boolean) => {
    setLoading(true);
    try {
      const res = await setTargetGuard(newHardened);
      setHardened(res.enabled);
      setMessage(res.enabled ? "Target guard ACTIVE (HARDENED)." : "Target guard DISABLED (VULNERABLE).");
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      setMessage(`Failed to set guard state: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-sky-700 font-mono font-extrabold">TARGET SECURITY GUARD CONTROL</span>
          <h3 className="mt-1.5 text-lg font-bold text-slate-900 flex items-center gap-3">
            Target Security Status:
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono font-bold tracking-wide uppercase border ${
                hardened
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs"
                  : "bg-rose-50 text-rose-700 border-rose-300 shadow-xs"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${hardened ? "bg-emerald-600" : "bg-rose-600"}`} />
              {hardened ? "HARDENED (Protected)" : "VULNERABLE (Default)"}
            </span>
          </h3>
          <p className="mt-1.5 text-sm text-slate-600">
            {hardened
              ? "Security guard is ACTIVE. Forbidden tool calls are intercepted and blocked, turning release gate GREEN."
              : "Security guard is OFF. Vulnerable to prompt injections and unauthorized delete_record tool execution."}
          </p>
        </div>
        <button
          onClick={() => toggleGuard(!hardened)}
          disabled={loading}
          className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-sm cursor-pointer ${
            hardened
              ? "bg-rose-600 text-white hover:bg-rose-700 border border-rose-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700"
          }`}
        >
          {loading ? "Updating Status..." : hardened ? "Disable Guard (Make Vulnerable)" : "Enable Guard (Harden Target)"}
        </button>
      </div>
      {message && <p className="mt-3.5 text-sm font-mono font-bold text-sky-800 bg-sky-50 p-3 rounded-xl border border-sky-200">{message}</p>}
    </div>
  );
}
