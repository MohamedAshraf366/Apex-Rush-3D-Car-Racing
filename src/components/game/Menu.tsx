"use client";

import { Footer } from "@/components/Footer";
import { TRACK_DEFS } from "./track";
import type { Difficulty, SuperheroSkin } from "./types";

export const SUPERHERO_SKINS: SuperheroSkin[] = [
  { id: "ironman", name: "Iron Man", color: "#d62828", accent: "#f3b22b", emoji: "🤖" },
  { id: "cap", name: "Captain America", color: "#3358b8", accent: "#f2f2f2", emoji: "🛡️" },
  { id: "batman", name: "Batman", color: "#17181c", accent: "#ecd53c", emoji: "🦇" },
  { id: "superman", name: "Superman", color: "#2b4bd1", accent: "#e02b20", emoji: "🦸" },
  { id: "wonder", name: "Wonder Woman", color: "#c0282f", accent: "#e8c243", emoji: "👑" },
  { id: "hulk", name: "Hulk", color: "#4f7d2f", accent: "#5b3a7a", emoji: "💪" },
];

export const CUSTOM_COLORS = [
  "#ff3b30",
  "#ff9500",
  "#ffd028",
  "#34c759",
  "#0a84ff",
  "#af52de",
  "#ff2d9b",
  "#ffffff",
  "#c8c8cd",
  "#1b1b1e",
];

const DIFFS: Array<{
  id: Difficulty;
  label: string;
  emoji: string;
  desc: string;
  accent: string;
  ring: string;
}> = [
  {
    id: "easy",
    label: "Easy",
    emoji: "🟢",
    desc: "Rivals cruise and make mistakes. Great for learning the track.",
    accent: "text-emerald-300",
    ring: "ring-emerald-400",
  },
  {
    id: "medium",
    label: "Medium",
    emoji: "🟡",
    desc: "Competitive pace. A fair fight for the podium.",
    accent: "text-amber-300",
    ring: "ring-amber-400",
  },
  {
    id: "hard",
    label: "Hard",
    emoji: "🔴",
    desc: "Rivals at full speed with a clean line. Good luck.",
    accent: "text-red-300",
    ring: "ring-red-400",
  },
];

function TrackPreview({ points }: { points: Array<[number, number]> }) {
  const w = 48;
  const h = 34;
  const pad = 3;
  const xs = points.map((p) => p[0]);
  const zs = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const sx = (w - pad * 2) / (maxX - minX || 1);
  const sz = (h - pad * 2) / (maxZ - minZ || 1);
  const s = Math.min(sx, sz);
  const ox = (w - pad * 2 - (maxX - minX) * s) / 2;
  const oy = (h - pad * 2 - (maxZ - minZ) * s) / 2;
  const px = (x: number) => pad + ox + (x - minX) * s;
  const py = (z: number) => pad + oy + (z - minZ) * s;
  const d = points
    .map(([x, z], i) => `${i === 0 ? "M" : "L"}${px(x).toFixed(1)} ${py(z).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-12" aria-hidden>
      <path d={`${d} Z`} fill="none" stroke="#8ea3cf" strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={px(points[0][0])} cy={py(points[0][1])} r={1.6} fill="#fff" />
    </svg>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 font-medium">
      {children}
    </span>
  );
}

export function Menu({
  difficulty,
  onSelect,
  onStart,
  trackId,
  onSelectTrack,
  heroId,
  onSelectHero,
  customColor,
  onSelectCustomColor,
}: {
  difficulty: Difficulty;
  onSelect: (d: Difficulty) => void;
  onStart: () => void;
  trackId: string;
  onSelectTrack: (trackId: string) => void;
  heroId: string;
  onSelectHero: (heroId: string) => void;
  customColor: string;
  onSelectCustomColor: (color: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gradient-to-br from-slate-950 via-[#131a3a] to-slate-950">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-xl animate-[fade-up_0.5s_ease-out] py-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-[0.4em] text-sky-400">
Built by Mohamed Ashraf Abdalhafeez            </div>
            <h1 className="mt-2 bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 bg-clip-text text-6xl font-black tracking-tight text-transparent sm:text-7xl">
              APEX RUSH
            </h1>
            <p className="mt-2 text-slate-300">You vs 3 AI rivals · 3 laps · 12 circuits</p>
          </div>

          <div className="mt-10">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Pick your ride
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {SUPERHERO_SKINS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectHero(s.id)}
                  className={`rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:bg-white/10 ${
                    heroId === s.id ? "bg-white/10 ring-2 ring-amber-400" : ""
                  }`}
                >
                  <div className="text-2xl">{s.emoji}</div>
                  <div className="mt-0.5 truncate text-[11px] font-bold text-white">{s.name}</div>
                  <div
                    className="mx-auto mt-1 h-1.5 w-full max-w-[3rem] rounded-full"
                    style={{ background: `linear-gradient(90deg, ${s.color}, ${s.accent})` }}
                  />
                </button>
              ))}
              <button
                onClick={() => onSelectHero("custom")}
                className={`rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:bg-white/10 ${
                  heroId === "custom" ? "bg-white/10 ring-2 ring-amber-400" : ""
                }`}
              >
                <div className="text-2xl">🎨</div>
                <div className="mt-0.5 text-[11px] font-bold text-white">Custom</div>
                <div
                  className="mx-auto mt-1 h-1.5 w-full max-w-[3rem] rounded-full"
                  style={{ background: customColor }}
                />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {CUSTOM_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onSelectCustomColor(c)}
                aria-label={`Color ${c}`}
                className={`h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                  heroId === "custom" && customColor === c
                    ? "border-amber-300"
                    : "border-white/20"
                }`}
                style={{ background: c }}
              />
            ))}
            <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2 text-[11px] font-bold uppercase tracking-wide text-white/80 transition hover:bg-white/10">
              <input
                type="color"
                value={customColor}
                onChange={(e) => onSelectCustomColor(e.target.value)}
                className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
              />
              More
            </label>
          </div>

          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Track · {TRACK_DEFS.length} circuits
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {TRACK_DEFS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className={`rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 transition hover:bg-white/10 ${
                    trackId === t.id ? "bg-white/10 ring-2 ring-sky-400" : ""
                  }`}
                >
                  <TrackPreview points={t.points} />
                  <div className="mt-0.5 truncate text-[11px] font-bold text-white">{t.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Difficulty
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {DIFFS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10 ${
                    difficulty === d.id ? `bg-white/10 ring-2 ${d.ring}` : ""
                  }`}
                >
                  <div className="text-2xl">{d.emoji}</div>
                  <div className={`mt-1 text-lg font-bold ${d.accent}`}>{d.label}</div>
                  <div className="mt-1 text-xs leading-snug text-slate-400">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onStart}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-red-500 py-4 text-xl font-black tracking-wide text-slate-950 shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            START RACE 🏁
          </button>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
            <Key>W / ↑ Accelerate</Key>
            <Key>S / ↓ Brake</Key>
            <Key>A·D / ←→ Steer</Key>
            <Key>C Camera</Key>
            <Key>R Reset car</Key>
            <Key>P Pause</Key>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            On a phone? On-screen controls appear automatically.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
