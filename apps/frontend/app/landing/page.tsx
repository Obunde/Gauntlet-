"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [showKeycloakModal, setShowKeycloakModal] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("admin@gauntlet.internal");
  const [password, setPassword] = useState("Gauntlet2026!");
  const [authRole, setAuthRole] = useState("Security Engineer (Admin)");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleKeycloakLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError("Please provide both username and password.");
      return;
    }
    setAuthenticated(true);
    setShowKeycloakModal(false);
    setLoginError(null);
    // Automatically navigate to Console Dashboard upon successful login
    router.push("/");
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Navbar Top */}
      <nav className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 text-xl shadow-[0_0_25px_rgba(103,232,249,0.2)] font-bold">
            ◇
          </span>
          <div>
            <strong className="block text-xl tracking-tight text-white">Gauntlet</strong>
            <span className="block text-xs font-mono text-cyan-400">Enterprise AI Security Gate</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {authenticated ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-xs font-mono text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Keycloak Auth Active ({authRole})</span>
            </div>
          ) : (
            <button
              onClick={() => setShowKeycloakModal(true)}
              className="secondary-button text-xs font-mono flex items-center gap-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Sign in with Keycloak SSO
            </button>
          )}

          <Link href="/" className="primary-button text-xs font-bold shadow-lg shadow-cyan-950/50">
            Launch Console →
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto py-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-mono font-bold text-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.15)]">
          ✨ HACKATHON EDITION · POWERED BY NVIDIA BREV GPUs
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.15]">
          Scanners find bugs. <br />
          <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
            Gauntlet makes sure they never come back.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An automated AI release gate that subjects LLM agents to adversarial attacks, produces reproducible traces, and converts failures into permanent Pytest regression suites.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/" className="primary-button text-base px-8 py-3.5 font-extrabold shadow-xl">
            Enter Security Console →
          </Link>
          <button
            onClick={() => setShowKeycloakModal(true)}
            className="secondary-button text-base px-7 py-3.5 font-bold border-white/20 hover:border-cyan-400/40"
          >
            🔐 Keycloak Enterprise Login
          </button>
        </div>
      </section>

      {/* Keycloak SSO Authentication Modal */}
      {showKeycloakModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#0d121d] p-6 space-y-5 shadow-2xl shadow-cyan-950/80">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-sm">
                  🔐
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Keycloak Identity Provider</h3>
                  <p className="text-xs text-slate-400 font-mono">Realm: gauntlet-security-realm</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeycloakModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleKeycloakLogin} className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                <label className="field-label text-xs">
                  Username / Email
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="field-control text-xs mt-1 font-mono"
                    placeholder="admin@gauntlet.internal"
                    required
                  />
                </label>

                <label className="field-label text-xs">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field-control text-xs mt-1 font-mono"
                    placeholder="••••••••••••"
                    required
                  />
                </label>

                <label className="field-label text-xs">
                  Role Assignment
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                    className="field-control text-xs mt-1 font-mono"
                  >
                    <option value="Security Engineer (Admin)">Security Engineer (Admin)</option>
                    <option value="DevOps Lead">DevOps Lead</option>
                    <option value="AI Compliance Auditor">AI Compliance Auditor</option>
                  </select>
                </label>

                <div className="rounded-lg bg-cyan-950/30 border border-cyan-500/20 p-2.5 text-[11px] text-cyan-300 font-mono">
                  🔑 <strong>Demo Credentials:</strong><br />
                  User: <span className="text-white">admin@gauntlet.internal</span><br />
                  Pass: <span className="text-white">Gauntlet2026!</span>
                </div>
              </div>

              {loginError && <p className="text-xs text-rose-300 font-mono">{loginError}</p>}

              <button
                type="submit"
                className="w-full primary-button py-3 text-sm font-bold shadow-lg shadow-cyan-950/50"
              >
                Sign in with Keycloak SSO
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-500">
              Enterprise OpenID Connect (OIDC) & SAML 2.0 Integration
            </p>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          ["🎯 OWASP LLM Red-Teaming", "Generates adversarial prompt injections and unauthorized tool executions using Brev cloud GPUs."],
          ["🔁 Auto-Pytest Regressions", "Converts every confirmed breach into a re-runnable Pytest assertion file (test_reg_XXX.py)."],
          ["🚦 RED / GREEN Release Gate", "Outputs a single release decision: RED (Blocked) on breach, GREEN (Clear to Ship) when hardened."],
        ].map(([title, desc], idx) => (
          <div key={idx} className="panel p-6 space-y-3 hover:border-cyan-400/40 transition-all">
            <span className="font-mono text-xs text-cyan-400 font-bold">0{idx + 1} FEATURE</span>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Architecture Flow Banner */}
      <section className="panel p-7 text-center space-y-4 bg-gradient-to-b from-[#101521]/95 to-[#0b0e17]/95 border-cyan-500/20">
        <span className="eyebrow text-cyan-400 font-mono">ENTERPRISE AGENT SAFETY CHECKPOINT</span>
        <h2 className="text-2xl font-bold text-white">How Gauntlet Protects Your AI Pipelines</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono font-semibold pt-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-cyan-300">1. Parse Policy YAML</div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-amber-300">2. Brev Red-Team Attacks</div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-rose-300">3. RED Gate & Trace Capture</div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3.5 text-emerald-300">4. Auto Pytest & GREEN Gate</div>
        </div>
      </section>
    </div>
  );
}
