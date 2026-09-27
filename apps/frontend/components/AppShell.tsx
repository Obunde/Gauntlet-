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
  const isLandingPage = pathname === "/" || pathname === "/landing";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isLoginPage && !isLandingPage) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoginPage, isLandingPage, router]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // On Login page or Landing page, render children full-screen without sidebar
  if (isLoginPage || isLandingPage) {
    return <main className="min-h-screen bg-slate-50 text-slate-900">{children}</main>;
  }

  // If redirecting to login, render loading background
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-sky-700 font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-sky-600 animate-ping" />
          Authenticating with Keycloak SSO...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)] bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="border-b border-slate-200 bg-white px-5 py-6 lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r flex flex-col justify-between shadow-sm">
        <div className="space-y-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-500/30 bg-sky-600 text-white text-xl shadow-md font-bold group-hover:scale-105 transition-transform">
              ◇
            </span>
            <div>
              <strong className="block text-base tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">Gauntlet</strong>
              <span className="block text-xs font-mono text-sky-700 font-bold">AI Security Release Gate</span>
            </div>
          </Link>

          <nav className="space-y-2" aria-label="Primary navigation">
            <Link
              href="/"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                pathname === "/" || pathname === "/landing"
                  ? "bg-sky-50 text-sky-700 border-l-4 border-sky-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-lg">✨</span> Product Overview
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                pathname === "/dashboard"
                  ? "bg-sky-50 text-sky-700 border-l-4 border-sky-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-lg">⌂</span> Console Dashboard
            </Link>
            <Link
              href={`/runs/${recorded.run_id}?replay=1`}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                pathname.startsWith("/runs")
                  ? "bg-sky-50 text-sky-700 border-l-4 border-sky-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="text-lg">↻</span> Recorded Audit Run
            </Link>
          </nav>
        </div>

        {/* User Profile Card & Sign Out */}
        <div className="mt-6 space-y-3 pt-4 border-t border-slate-200">
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 font-mono">AUTHENTICATED USER</span>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate">{user?.username}</p>
              <p className="text-[11px] font-mono text-slate-600 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-sm cursor-pointer"
          >
            <span>🚪</span> Sign Out / Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 lg:col-start-2">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-bold">
            <span className="text-sky-700 uppercase tracking-wider">GAUNTLET RELEASE GATE</span>
            <span>/</span>
            <span className="text-slate-900">{pathname === "/" ? "Overview" : pathname === "/dashboard" ? "Dashboard" : pathname === "/landing" ? "Product Overview" : "Console Audit"}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-mono font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Keycloak Enterprise SSO</span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-mono font-bold text-rose-700 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
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
