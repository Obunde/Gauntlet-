"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import recorded from "@/mocks/run_mock.json";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoginPage, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // On Login page, render children full-screen without sidebar
  if (isLoginPage) {
    return <main className="min-h-screen bg-[#050810] text-slate-100">{children}</main>;
  }

  // If redirecting to login, render dark loading background
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#050810] text-cyan-400 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
          Authenticating with Keycloak SSO...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)] bg-[#050810]">
      {/* Sidebar Navigation */}
      <aside className="border-b border-white/10 bg-[#080b12]/95 px-5 py-5 backdrop-blur lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r flex flex-col justify-between">
        <div className="space-y-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 text-xl shadow-[0_0_25px_rgba(103,232,249,0.15)] font-bold group-hover:scale-105 transition-transform">
              ◇
            </span>
            <div>
              <strong className="block text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">Gauntlet</strong>
              <span className="block text-xs font-mono text-cyan-400">AI release gate</span>
            </div>
          </Link>

          <nav className="space-y-1.5" aria-label="Primary navigation">
            <Link
              href="/dashboard"
              className={`nav-link font-bold ${pathname === "/dashboard" || pathname === "/" ? "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 pl-3" : "text-slate-300 hover:text-white"}`}
            >
              <span>⌂</span> Console Dashboard
            </Link>
            <Link
              href={`/runs/${recorded.run_id}?replay=1`}
              className={`nav-link ${pathname.startsWith("/runs") ? "bg-cyan-500/15 text-cyan-300 border-l-2 border-cyan-400 pl-3" : "text-slate-400 hover:text-slate-200"}`}
            >
              <span>↻</span> Recorded Run
            </Link>
          </nav>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="mt-6 space-y-3 pt-4 border-t border-white/10">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="eyebrow text-cyan-400 text-[10px]">LOGGED IN USER</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate">{user?.username}</p>
              <p className="text-[11px] font-mono text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all shadow-md"
          >
            <span>🚪</span> Sign Out / Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 lg:col-start-2">
        {/* Top Header Bar with Sign Out option */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#080b12]/80 px-6 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-bold">GAUNTLET SYSTEM</span>
            <span>/</span>
            <span className="text-slate-200">{pathname === "/" ? "Overview" : pathname === "/dashboard" ? "Dashboard" : "Console"}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-mono text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Keycloak Authenticated</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-mono font-bold text-rose-300 hover:text-rose-200 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors"
            >
              <span>🚪</span> Log Out
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</div>
      </main>
    </div>
  );
}
