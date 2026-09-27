"use client";

import { useState } from "react";
import type { RegressionTest } from "@/lib/types";

type Tab = "pytest" | "ci";

const workflow = `name: Gauntlet security regression

on:
  pull_request:
  push:
    branches: [main]

jobs:
  security-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install pytest httpx
      - run: pytest tests/security -q`;

export default function RegressionCode({ test }: { test: RegressionTest }) {
  const [tab, setTab] = useState<Tab>("pytest");
  const [copied, setCopied] = useState(false);
  const code = tab === "pytest" ? test.code : workflow;
  const filename = tab === "pytest" ? `test_${test.test_id}.py` : "gauntlet-security.yml";

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: filename });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel overflow-hidden p-0 border border-slate-200 bg-white rounded-2xl shadow-xs">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              tab === "pytest"
                ? "bg-white text-sky-700 border border-sky-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
            onClick={() => setTab("pytest")}
          >
            Pytest
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              tab === "ci"
                ? "bg-white text-sky-700 border border-sky-300 shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
            onClick={() => setTab("ci")}
          >
            GitHub Actions
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="secondary-button text-xs font-mono font-bold py-1 px-3 border-slate-300 hover:bg-slate-100"
            aria-label="Copy code"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="primary-button text-xs font-mono font-bold py-1 px-3"
            aria-label={`Download ${filename}`}
          >
            Download
          </button>
        </div>
      </div>
      <div className="border-b border-slate-200 px-5 py-2.5 bg-slate-100/70 mono text-xs font-bold text-slate-700">
        {filename}
        {tab === "pytest" ? ` · asserts ${test.assertion}` : ""}
      </div>
      <pre className="max-h-[520px] overflow-auto bg-slate-50 p-5 mono text-xs leading-relaxed text-slate-900 font-semibold border-t-0">
        <code>{code}</code>
      </pre>
    </div>
  );
}
