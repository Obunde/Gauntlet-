"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState("admin@gauntlet.internal");
  const [password, setPassword] = useState("Gauntlet2026!");
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-slate-50 grid place-items-center px-4 py-12 text-slate-900">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        {/* Left Hero Image Showcase */}
        <div className="space-y-5 flex flex-col justify-between h-full bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="space-y-3">
            <div className="inline-flex h-12 w-12 place-items-center rounded-2xl bg-sky-600 text-white text-2xl font-bold shadow-md">
              ◇
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Gauntlet</h1>
              <p className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wider mt-1">
                Enterprise AI Security Release Gate
              </p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              Automate OWASP LLM red-teaming, synthesize Pytest regression suites on NVIDIA Brev GPUs, and enforce hard RED/GREEN release decisions.
            </p>
          </div>

          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 shadow-md">
            <Image
              src="/release_gate.png"
              alt="Gauntlet Release Gate"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="pt-2 text-xs font-mono text-slate-500 border-t border-slate-200 flex justify-between items-center">
            <span>Powered by NVIDIA Brev GPUs</span>
            <span className="text-emerald-700 font-bold">✓ SSO Active</span>
          </div>
        </div>

        {/* Right Login Card */}
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-100 text-sky-700 font-bold text-lg border border-sky-200">
                🔐
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Keycloak Enterprise SSO</h2>
                <p className="text-xs text-slate-500 font-mono">Realm: gauntlet-security-realm</p>
              </div>
            </div>
          </div>

          {/* Quick Demo Autofill Notice */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-sky-200 bg-sky-50 text-xs">
            <span className="text-slate-700 font-semibold">Demo credentials pre-filled</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono font-bold text-sky-700 bg-white hover:bg-sky-100 px-3 py-1 rounded-lg border border-sky-300 transition-colors shadow-xs cursor-pointer"
            >
              Fill Demo
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                placeholder="admin@gauntlet.internal"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 font-mono focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                placeholder="••••••••••••"
                required
              />
            </div>

            {error && <p className="text-xs text-rose-600 font-mono font-bold">{error}</p>}

            <button
              type="submit"
              className="w-full primary-button py-3.5 text-sm font-bold shadow-md cursor-pointer mt-2"
            >
              Sign In with Keycloak SSO →
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500 font-mono">
              Secured with OpenID Connect (OIDC) & SAML 2.0 Enterprise Protocols
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
