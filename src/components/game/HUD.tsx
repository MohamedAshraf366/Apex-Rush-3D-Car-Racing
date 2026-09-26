"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TOTAL_LAPS, fmt, progressOf } from "./physics";
import { TRACK } from "./track";
import type { CarState, RaceState } from "./types";

function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl bg-black/45 backdrop-blur-sm ring-1 ring-white/15 ${className}`}>
      {children}
    </div>
  );
}

function gapText(c: CarState, player: CarState): string {
  if (c.isPlayer) return "";
  if (c.finished) return "flag";
  const diff = progressOf(player) - progressOf(c);
  const m = Math.round(Math.abs(diff));
  return diff >= 0 ? `+${m}m` : `−${m}m`;
}

function MiniMap({ race }: { race: RaceState }) {
  const w = 150;
  const h = 110;
  const pad = 10;
  const { path, px, py, startX, startZ } = useMemo(() => {
    const b = TRACK.bounds;
    const sx = (w - pad * 2) / (b.maxX - b.minX);
    const sz = (h - pad * 2) / (b.maxZ - b.minZ);
    const s = Math.min(sx, sz);
    const ox = (w - pad * 2 - (b.maxX - b.minX) * s) / 2;
    const oy = (h - pad * 2 - (b.maxZ - b.minZ) * s) / 2;
    const px = (x: number) => pad + ox + (x - b.minX) * s;
    const py = (z: number) => pad + oy + (z - b.minZ) * s;
    let d = "";
    for (let i = 0; i < TRACK.samples.length; i += 10) {
      const p = TRACK.samples[i].pos;
      d += (i === 0 ? "M" : "L") + px(p.x).toFixed(1) + " " + py(p.z).toFixed(1) + " ";
    }
    const start = TRACK.samples[0].pos;
    return { path: d + "Z", px, py, startX: px(start.x), startZ: py(start.z) };
  }, []);

  return (
    <svg width={w} height={h} className="block">
      <path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={5.5} strokeLinejoin="round" />
      <path d={path} fill="none" stroke="rgba(15,18,24,0.95)" strokeWidth={3.4} strokeLinejoin="round" />
      <circle cx={startX} cy={startZ} r={2.4} fill="#fff" />
      {race.boosts.filter((b) => !b.collected).map((b) => (
        <circle
          key={`b${b.id}`}
          cx={px(b.pos.x)}
          cy={py(b.pos.z)}
          r={1.7}
          fill="#ffd23f"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.8}
        />
      ))}
      {race.obstacles.map((o) => (
        <circle
          key={`o${o.id}`}
          cx={px(o.pos.x)}
          cy={py(o.pos.z)}
          r={o.kind === "tire" ? 2.4 : 1.6}
          fill="#ff8a3d"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.8}
        />
      ))}
      {race.cars.map((c) => (
        <circle
          key={c.id}
          cx={px(c.pos.x)}
          cy={py(c.pos.z)}
          r={c.isPlayer ? 4.4 : 3.4}
          fill={c.color}
          stroke={c.isPlayer ? "#fff" : "rgba(0,0,0,0.5)"}
          strokeWidth={c.isPlayer ? 1.6 : 1}
        />
      ))}
    </svg>
  );
}

export function HUD({ race }: { race: RaceState }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(iv);
  }, []);

  const player = race.cars[race.playerIndex];
  const speedKmh = Math.round(Math.abs(player.speed) * 3.6);
  const lap = Math.min(Math.max(player.lap, 1), TOTAL_LAPS);
  const order = [...race.cars].sort((a, b) => a.rank - b.rank);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
      {/* top left: position + lap */}
      <div className="absolute left-3 top-3 flex gap-2 sm:left-5 sm:top-5 sm:gap-3">
        <Panel className="flex items-baseline gap-1.5 px-3 py-2 sm:px-4">
          <span className="text-3xl font-black leading-none sm:text-4xl">P{player.rank}</span>
          <span className="text-xs font-semibold text-white/70 sm:text-sm">/{race.cars.length}</span>
        </Panel>
        <Panel className="px-3 py-2 sm:px-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-xs">Lap</div>
          <div className="text-xl font-black leading-tight sm:text-2xl">
            {lap}
            <span className="text-sm text-white/60">/{TOTAL_LAPS}</span>
          </div>
        </Panel>
      </div>

      {/* top center: time */}
      <div className="absolute left-1/2 top-3 -translate-x-1/2 sm:top-5">
        <Panel className="px-4 py-2 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60 sm:text-xs">Time</div>
          <div className="text-xl font-black leading-tight tabular-nums sm:text-2xl">{fmt(race.time)}</div>
          <div className="text-[10px] tabular-nums text-white/70 sm:text-xs">
            Best {player.bestLap != null ? fmt(player.bestLap) : "—"}
          </div>
        </Panel>
      </div>

      {/* top right: minimap */}
      <div className="absolute right-3 top-3 sm:right-5 sm:top-5">
        <Panel className="p-1.5">
          <MiniMap race={race} />
        </Panel>
      </div>

      {/* bottom left: live standings */}
      <div className="absolute bottom-3 left-3 hidden sm:bottom-5 sm:left-5 sm:block">
        <Panel className="space-y-1 px-3 py-2">
          {order.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              <span className="w-4 font-bold tabular-nums text-white/60">{c.rank}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              <span className={c.isPlayer ? "font-bold" : "font-medium text-white/85"}>{c.name}</span>
              <span className="text-xs tabular-nums text-white/60">{gapText(c, player)}</span>
            </div>
          ))}
        </Panel>
      </div>

      {/* bottom right: speedometer */}
      <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5">
        <Panel className="px-4 py-2 text-right">
          <div className="text-4xl font-black leading-none tabular-nums text-white sm:text-5xl">
            {speedKmh}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/60 sm:text-xs">
            km/h
          </div>
        </Panel>
        {player.boostTime > 0 && (
          <Panel className="mt-2 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="animate-pulse text-base leading-none">⚡</span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Boost
              </span>
              <div className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500"
                  style={{ width: `${(player.boostTime / 4) * 100}%` }}
                />
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* difficulty pill */}
      <div className="absolute left-1/2 top-24 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70 sm:top-28 sm:text-xs">
        {race.difficulty} · {TOTAL_LAPS} laps
      </div>

      {/* wrong way */}
      {player.wrongWayTime > 0.7 && (
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2">
          <div className="animate-pulse rounded-lg bg-red-600/90 px-5 py-2 text-xl font-black tracking-wide">
            WRONG WAY
          </div>
        </div>
      )}
    </div>
  );
}
