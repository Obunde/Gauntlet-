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
      setHardened(res.hardened);
      setMessage(res.message);
      setTimeout(() => setMessage(null), 3500);
    } catch (err) {
      setMessage(`Failed to set guard state: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="eyebrow text-cyan-400 font-mono">TARGET SECURITY GUARD CONTROL</span>
          <h3 className="mt-1.5 text-lg font-bold text-white flex items-center gap-3">
            Target Security Status:
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-mono font-bold tracking-wide uppercase border ${
                hardened
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${hardened ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400 shadow-[0_0_8px_#f43f5e]"}`} />
              {hardened ? "HARDENED (Protected)" : "VULNERABLE (Default)"}
            </span>
          </h3>
          <p className="mt-1.5 text-sm text-slate-300">
            {hardened
              ? "Security guard is ACTIVE. Forbidden tool calls are intercepted and blocked, turning release gate GREEN."
              : "Security guard is OFF. Vulnerable to prompt injections and unauthorized delete_record tool execution."}
          </p>
        </div>
        <button
          onClick={() => toggleGuard(!hardened)}
          disabled={loading}
          className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${
            hardened
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 shadow-rose-950/50"
              : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30 shadow-emerald-950/50"
          }`}
        >
          {loading ? "Updating Status..." : hardened ? "Disable Guard (Make Vulnerable)" : "Enable Guard (Harden Target)"}
        </button>
      </div>
      {message && <p className="mt-3.5 text-sm font-mono font-semibold text-cyan-300 animate-fade-in bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">{message}</p>}
    </div>
  );
}
