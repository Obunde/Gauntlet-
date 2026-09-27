"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeLandingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-[#050810] text-cyan-400 font-mono text-sm">
      <div className="flex items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-cyan-400 animate-ping" />
        Redirecting to Console Dashboard...
      </div>
    </div>
  );
}
