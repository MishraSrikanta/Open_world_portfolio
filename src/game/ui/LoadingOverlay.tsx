"use client";

export function LoadingOverlay({
  progress,
  label = "Loading world…",
}: {
  progress: number;
  label?: string;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-cozy-night text-white">
      <div className="mb-6 text-center">
        <div className="text-3xl font-extrabold tracking-tight">
          Open World Portfolio
        </div>
        <div className="mt-1 text-sm text-white/60">{label}</div>
      </div>
      <div className="h-2 w-64 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-[width] duration-300"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-white/40">
        {Math.round(progress * 100)}%
      </div>
    </div>
  );
}
