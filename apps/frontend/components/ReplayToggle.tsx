"use client";

/** Replay mode shows the recorded run instead of starting a live one (demo safety net). */
export default function ReplayToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-400">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-white" />
      Replay recorded run
    </label>
  );
}
