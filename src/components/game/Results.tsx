"use client";

import { TOTAL_LAPS, fmt } from "./physics";
import type { RaceState } from "./types";

export function Results({
  race,
  onRestart,
  onMenu,
}: {
  race: RaceState;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const player = race.cars[race.playerIndex];
  const headline = player.rank === 1 ? "🏆 VICTORY!" : `🏁 Race complete — P${player.rank}`;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-[fade-up_0.4s_ease-out] rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl">
        <h2 className="text-center text-3xl font-black text-white">{headline}</h2>
        <p className="mt-1 text-center text-sm capitalize text-slate-400">
          {race.difficulty} · {TOTAL_LAPS} laps · total {fmt(race.finishedAt ?? race.time)}
        </p>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="py-1 pr-2">Pos</th>
              <th className="py-1 pr-2">Driver</th>
              <th className="py-1 text-right">Best lap</th>
              <th className="py-1 pl-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {race.standings.map((s) => (
              <tr
                key={s.id}
                className={`border-t border-white/5 ${s.isPlayer ? "font-bold text-amber-300" : "text-slate-200"}`}
              >
                <td className="py-2 pr-2 font-black">P{s.rank}</td>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {s.bestLap != null ? fmt(s.bestLap) : "—"}
                </td>
                <td className="py-2 pl-2 text-right tabular-nums">
                  {s.finished && s.finishTime != null ? fmt(s.finishTime) : "racing…"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onRestart}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-red-500 py-3 font-black text-slate-950 transition hover:brightness-110"
          >
            RACE AGAIN
          </button>
          <button
            onClick={onMenu}
            className="rounded-xl border border-white/15 bg-white/5 py-3 font-bold text-white transition hover:bg-white/10"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
