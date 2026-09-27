"use client";

/** Replay mode shows the recorded run instead of starting a live one (demo safety net). */
export default function ReplayToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mt-2 flex h-[46px] cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-[#0b0f18] px-3.5 text-xs text-slate-300">
      <span>{value ? "Recorded replay" : "Live pipeline"}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${value ? "bg-cyan-300" : "bg-slate-700"}`}>
        <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="sr-only" />
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${value ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </label>
  );
}
