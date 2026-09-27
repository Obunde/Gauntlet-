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
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage(`Failed to set guard state: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow">TARGET SECURITY GUARD</span>
          <h3 className="mt-1 text-sm font-bold text-white flex items-center gap-2">
            Target Status:
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                hardened
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${hardened ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400 shadow-[0_0_8px_#f43f5e]"}`} />
              {hardened ? "HARDENED (Protected)" : "VULNERABLE (Default)"}
            </span>
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {hardened
              ? "Security guard is ACTIVE. Forbidden tools are blocked, forcing gate to turn GREEN."
              : "Security guard is OFF. Vulnerable to prompt injections and forbidden tool calls."}
          </p>
        </div>
        <button
          onClick={() => toggleGuard(!hardened)}
          disabled={loading}
          className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition-all shadow-md ${
            hardened
              ? "bg-rose-500/20 text-rose-200 border border-rose-500/30 hover:bg-rose-500/30"
              : "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30"
          }`}
        >
          {loading ? "Updating..." : hardened ? "Disable Guard (Make Vulnerable)" : "Enable Guard (Harden Target)"}
        </button>
      </div>
      {message && <p className="mt-3 text-xs font-mono text-cyan-300 animate-fade-in">{message}</p>}
    </div>
  );
}
