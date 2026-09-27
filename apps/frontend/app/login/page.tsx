"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("admin@gauntlet.internal");
  const [password, setPassword] = useState("Gauntlet2026!");
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("gauntlet-theme") as "dark" | "light") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("gauntlet-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleFillDemo = () => {
    setUsername("admin@gauntlet.internal");
    setPassword("Gauntlet2026!");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }
    setError(null);
    login(username, "Security Engineer (Admin)");
    router.replace("/dashboard");
  };

  return (
    <div className="relative min-h-screen grid place-items-center px-4 py-12 bg-[#050810] transition-colors duration-300">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="text-xs font-mono font-bold px-4 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <span>{theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
        </button>
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-cyan-200 text-3xl shadow-[0_0_40px_rgba(103,232,249,0.3)] font-bold mx-auto backdrop-blur-md">
            ◇
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Gauntlet</h1>
            <p className="text-xs font-mono text-cyan-400 tracking-wider uppercase mt-1">
              Enterprise AI Security Release Gate
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-cyan-500/40 bg-[#0c101a]/95 p-8 shadow-2xl shadow-cyan-950/80 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-lg">
                🔐
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Keycloak Enterprise SSO</h2>
                <p className="text-xs text-slate-400 font-mono">Realm: gauntlet-security-realm</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SSO Active
            </span>
          </div>

          {/* Quick Demo Autofill Notice */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs">
            <span className="text-slate-300 font-medium">Demo credentials pre-filled</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900/80 px-2.5 py-1 rounded border border-cyan-500/40 transition-colors"
            >
              Fill Demo
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="field-label text-xs">
              <span className="block mb-1.5 font-bold text-slate-200">Username / Email</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-500/30 bg-[#060913] px-4 py-3 text-sm text-white placeholder:text-slate-500 font-mono focus:border-cyan-400 focus:bg-[#090e1c] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                placeholder="admin@gauntlet.internal"
                required
              />
            </label>

            <label className="field-label text-xs">
              <span className="block mb-1.5 font-bold text-slate-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-500/30 bg-[#060913] px-4 py-3 text-sm text-white placeholder:text-slate-500 font-mono focus:border-cyan-400 focus:bg-[#090e1c] focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all shadow-inner"
                placeholder="••••••••••••"
                required
              />
            </label>

            {error && <p className="text-xs text-rose-300 font-mono">{error}</p>}

            <button
              type="submit"
              className="w-full primary-button py-3.5 text-sm font-bold shadow-lg shadow-cyan-950/60 mt-2 cursor-pointer"
            >
              Sign In with Keycloak SSO →
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 font-mono">
              Secured with OpenID Connect (OIDC) & SAML 2.0 Enterprise Protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

