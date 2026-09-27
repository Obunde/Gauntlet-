"use client";

import { useState } from "react";
import type { RegressionTest } from "@/lib/types";

export default function RegressionCode({ test }: { test: RegressionTest }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(test.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([test.code], { type: "text/x-python" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `test_${test.test_id}.py` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono text-[11px] text-slate-400">test_{test.test_id}.py · asserts {test.assertion}</span>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            Download .py
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto bg-black/20 p-5 font-mono text-xs leading-6 text-slate-300">{test.code}</pre>
    </div>
  );
}
