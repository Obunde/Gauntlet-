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
    <div className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-zinc-800 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="segmented w-full sm:w-auto">
          <button type="button" className="segment" aria-pressed={tab === "pytest"} onClick={() => setTab("pytest")}>Pytest</button>
          <button type="button" className="segment" aria-pressed={tab === "ci"} onClick={() => setTab("ci")}>GitHub Actions</button>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <button onClick={copy} className="icon-button" aria-label="Copy code">{copied ? "Copied" : "Copy"}</button>
          <button onClick={download} className="icon-button" aria-label={`Download ${filename}`}>Download</button>
        </div>
      </div>
      <div className="border-b border-zinc-800 px-4 py-2 mono text-[11px] text-zinc-600">{filename}{tab === "pytest" ? ` · asserts ${test.assertion}` : ""}</div>
      <pre className="max-h-[520px] overflow-auto bg-zinc-950/60 p-5 mono text-xs leading-6 text-zinc-300"><code>{code}</code></pre>
    </div>
  );
}
