"use client";

/** Replay mode shows the recorded run instead of starting a live one (demo safety net). */
export default function ReplayToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="segmented" aria-label="Execution mode">
      <button type="button" className="segment" aria-pressed={!value} onClick={() => onChange(false)}>Live</button>
      <button type="button" className="segment" aria-pressed={value} onClick={() => onChange(true)}>Recorded</button>
    </div>
  );
}
