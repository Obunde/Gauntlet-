"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = useAuth();
  const [showKeycloakModal, setShowKeycloakModal] = useState(false);
  const [username, setUsername] = useState("admin@gauntlet.internal");
  const [password, setPassword] = useState("Gauntlet2026!");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleFillDemo = () => {
    setUsername("admin@gauntlet.internal");
    setPassword("Gauntlet2026!");
    setLoginError(null);
  };

  const handleKeycloakLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError("Please provide both username and password.");
      return;
    }
    login(username, "Security Engineer (Admin)");
    setShowKeycloakModal(false);
    setLoginError(null);
    router.push("/dashboard");
  };

  const handleLaunchConsole = () => {
    if (!isAuthenticated) {
      login("admin@gauntlet.internal", "Security Engineer (Admin)");
    }
    router.push("/dashboard");
  };

  return (
    <div className="space-y-12 pb-16 bg-slate-50 text-slate-900 min-h-screen px-4 sm:px-8 py-8">
      {/* Navbar Top */}
      <nav className="flex items-center justify-between border-b border-slate-200 pb-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-600 text-white text-xl shadow-md font-bold">
            ◇
          </span>
          <div>
            <strong className="block text-xl tracking-tight text-slate-900">Gauntlet</strong>
            <span className="block text-xs font-mono text-sky-700 font-bold">Enterprise AI Security Gate</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-mono text-emerald-700 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Keycloak SSO Active ({user.username})</span>
            </div>
          ) : (
            <button
              onClick={() => setShowKeycloakModal(true)}
              className="secondary-button text-xs font-mono flex items-center gap-2 border-sky-300 text-sky-700 hover:bg-sky-50 cursor-pointer font-bold"
            >
              <span className="h-2 w-2 rounded-full bg-sky-600" />
              Sign in with Keycloak SSO
            </button>
          )}

          <button onClick={handleLaunchConsole} className="primary-button text-xs font-bold shadow-md cursor-pointer">
            Launch Console →
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-5xl mx-auto py-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-1.5 text-xs font-mono font-bold text-sky-700 shadow-xs">
          ✨ HACKATHON EDITION · POWERED BY NVIDIA BREV GPUs
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl leading-[1.15]">
          Scanners find bugs. <br />
          <span className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
            Gauntlet makes sure they never come back.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          An automated AI release gate that subjects LLM agents to adversarial attacks, produces reproducible traces, and converts failures into permanent Pytest regression suites.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button onClick={handleLaunchConsole} className="primary-button text-base px-8 py-3.5 font-extrabold shadow-lg cursor-pointer">
            Enter Security Console →
          </button>
          {!isAuthenticated && (
            <button
              onClick={() => setShowKeycloakModal(true)}
              className="secondary-button text-base px-7 py-3.5 font-bold border-slate-300 hover:border-sky-500 cursor-pointer"
            >
              🔐 Keycloak Enterprise Login
            </button>
          )}
        </div>

        {/* Product Architecture Hero Image Showcase */}
        <div className="relative w-full max-w-4xl h-72 sm:h-96 mx-auto rounded-3xl overflow-hidden border-2 border-slate-300 shadow-2xl mt-8">
          <Image
            src="/release_gate.png"
            alt="Gauntlet Security Release Gate Architecture"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-white text-xs font-mono font-bold">
            <span>RELEASE GATE ARCHITECTURE</span>
            <span className="bg-sky-600/90 px-3 py-1 rounded-full border border-white/20">NVIDIA Brev GPU Telemetry</span>
          </div>
        </div>
      </section>

      {/* Keycloak SSO Authentication Modal */}
      {showKeycloakModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-300 bg-white p-6 space-y-5 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700 font-bold text-base border border-sky-200">
                  🔐
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Keycloak Identity Provider</h3>
                  <p className="text-xs text-slate-500 font-mono">Realm: gauntlet-security-realm</p>
                </div>
              </div>
              <button
                onClick={() => setShowKeycloakModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Demo Autofill Notice */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-sky-200 bg-sky-50 text-xs">
              <span className="text-slate-700 font-semibold">Demo credentials pre-filled</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-mono font-bold text-sky-700 bg-white hover:bg-sky-100 px-3 py-1 rounded-lg border border-sky-300 transition-colors shadow-xs cursor-pointer"
              >
                Fill Demo
              </button>
            </div>

            <form onSubmit={handleKeycloakLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-sky-600 focus:outline-none"
                  placeholder="admin@gauntlet.internal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 font-mono focus:border-sky-600 focus:outline-none"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {loginError && <p className="text-xs text-rose-600 font-mono font-bold">{loginError}</p>}

              <button
                type="submit"
                className="w-full primary-button py-3 text-sm font-bold shadow-md cursor-pointer mt-1"
              >
                Sign in with Keycloak SSO →
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-500 font-mono">
              Enterprise OpenID Connect (OIDC) & SAML 2.0 Integration
            </p>
          </div>
        </div>
      )}

      {/* Feature Grid */}
      <section className="grid gap-6 sm:grid-cols-3 max-w-6xl mx-auto">
        {[
          ["🎯 OWASP LLM Red-Teaming", "Generates adversarial prompt injections and unauthorized tool executions using Brev cloud GPUs."],
          ["🔁 Auto-Pytest Regressions", "Converts every confirmed breach into a re-runnable Pytest assertion file (test_reg_XXX.py)."],
          ["🚦 RED / GREEN Release Gate", "Outputs a single release decision: RED (Blocked) on breach, GREEN (Clear to Ship) when hardened."],
        ].map(([title, desc], idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
            <span className="font-mono text-xs text-sky-700 font-bold">0{idx + 1} FEATURE</span>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Architecture Flow Banner */}
      <section className="max-w-6xl mx-auto rounded-3xl p-8 text-center space-y-4 bg-white border border-slate-200 shadow-md">
        <span className="eyebrow text-sky-700 font-mono font-extrabold">ENTERPRISE AGENT SAFETY CHECKPOINT</span>
        <h2 className="text-2xl font-bold text-slate-900">How Gauntlet Protects Your AI Pipelines</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono font-bold pt-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">1. Parse Policy YAML</div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">2. Brev Red-Team Attacks</div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">3. RED Gate & Trace Capture</div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">4. Auto Pytest & GREEN Gate</div>
        </div>
      </section>
    </div>
  );
}
