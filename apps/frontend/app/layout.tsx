import type { Metadata } from "next";
import Link from "next/link";
import recorded from "@/mocks/run_mock.json";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gauntlet — AI security release gate",
  description: "Adversarial testing and regression protection for AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 bg-[#080b12]/95 px-5 py-5 backdrop-blur lg:fixed lg:inset-y-0 lg:w-[248px] lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between lg:block">
              <Link href="/" className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(103,232,249,.12)] font-bold">
                  ◇
                </span>
                <span>
                  <strong className="block text-base tracking-tight text-white">Gauntlet</strong>
                  <span className="block text-xs font-mono text-cyan-400">AI release gate</span>
                </span>
              </Link>
              <span className="status-pill lg:hidden"><i /> Sandbox</span>
            </div>

            <nav className="mt-6 flex gap-2 lg:mt-10 lg:block lg:space-y-2" aria-label="Primary navigation">
              <Link href="/" className="nav-link font-bold text-slate-100">
                <span>🌐</span> Product Overview
              </Link>
              <Link href="/dashboard" className="nav-link font-bold text-cyan-300">
                <span>⌂</span> Console Dashboard
              </Link>
              <Link href={`/runs/${recorded.run_id}?replay=1`} className="nav-link">
                <span>↻</span> Recorded Run
              </Link>
            </nav>

            <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/[0.025] p-4 lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:block space-y-2">
              <p className="eyebrow">Environment & Auth</p>
              <p className="text-sm font-semibold text-slate-200">Keycloak SSO Active</p>
              <p className="font-mono text-xs text-cyan-300">localhost:8001 (Sandbox)</p>
              <p className="flex items-center gap-2 text-xs text-emerald-300 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]" /> Ready for testing
              </p>
            </div>
          </aside>
          <main className="min-w-0 lg:col-start-2">
            <div className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
