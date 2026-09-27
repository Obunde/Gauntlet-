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
    <div className="rounded-xl border border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="font-mono text-xs text-neutral-400">test_{test.test_id}.py · asserts {test.assertion}</span>
        <div className="flex gap-2">
          <button onClick={copy} className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800">
            Download .py
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-neutral-200">{test.code}</pre>
    </div>
  );
}
