"use client";

export function Countdown({ n }: { n: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div key={n} className="animate-[pop-in_0.85s_ease-out] text-center">
        <div className="text-[7rem] font-black leading-none text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)] sm:text-[9rem]">
          {n > 0 ? n : "GO!"}
        </div>
        {n > 0 && (
          <div className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-white/80">
            Get ready
          </div>
        )}
      </div>
    </div>
  );
}

export function PauseOverlay({
  onResume,
  onRestart,
  onMenu,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-center shadow-2xl">
        <h2 className="text-2xl font-black text-white">Paused</h2>
        <div className="mt-5 space-y-3">
          <button
            onClick={onResume}
            className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-red-500 py-3 font-black text-slate-950 transition hover:brightness-110"
          >
            RESUME
          </button>
          <button
            onClick={onRestart}
            className="w-full rounded-xl border border-white/15 bg-white/5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            Restart race
          </button>
          <button
            onClick={onMenu}
            className="w-full rounded-xl border border-white/15 bg-white/5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            Main menu
          </button>
        </div>
      </div>
    </div>
  );
}
