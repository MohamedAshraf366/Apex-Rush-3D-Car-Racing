"use client";

import dynamic from "next/dynamic";

const GameShell = dynamic(() => import("@/components/game/GameShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-sm font-medium tracking-wide text-slate-400">
      Loading track…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="fixed inset-0 overflow-hidden">
      <GameShell />
    </main>
  );
}
