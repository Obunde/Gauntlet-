import type { Metadata } from "next";
import Link from "next/link";
import recorded from "@/mocks/run_mock.json";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gauntlet — AI security release gate",
  description: "Adversarial testing and regression protection for AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('gauntlet-theme');
                  if (saved === 'light' || saved === 'dark') {
                    document.documentElement.setAttribute('data-theme', saved);
                  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <header className="topbar">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Gauntlet dashboard">
              <span className="brand-mark">G</span>
              <span className="text-sm font-semibold tracking-tight text-zinc-100">Gauntlet</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Primary navigation">
              <Link href="/" className="nav-link">New scan</Link>
              <Link href={`/runs/${recorded.run_id}?replay=1`} className="nav-link">Recorded run</Link>
              <span className="ml-2 hidden items-center gap-1.5 text-xs text-zinc-500 sm:inline-flex"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sandbox</span>
              <div className="ml-2 flex items-center border-l border-zinc-800 pl-2">
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-6xl px-5 py-8 sm:px-8 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
