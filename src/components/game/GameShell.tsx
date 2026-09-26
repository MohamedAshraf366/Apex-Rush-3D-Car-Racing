"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { RaceView } from "./RaceView";
import { Menu } from "./Menu";
import { HUD } from "./HUD";
import { Results } from "./Results";
import { Countdown, PauseOverlay } from "./Overlays";
import { TouchControls } from "./TouchControls";
import { createRace, respawnCar } from "./physics";
import { useKeyboard } from "./useKeyboard";
import { SUPERHERO_SKINS } from "./Menu";
import { setTrack } from "./track";
import type { Difficulty, RaceState } from "./types";

type Phase = "menu" | "countdown" | "racing" | "finished";

export default function GameShell() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [trackId, setTrackId] = useState("street");
  const [heroId, setHeroId] = useState("custom");
  const [customColor, setCustomColor] = useState("#ff3b30");
  const [count, setCount] = useState(-1); // -1 = hidden, 3/2/1 = numbers, 0 = GO!
  const [paused, setPaused] = useState(false);
  const [race, setRace] = useState<RaceState | null>(null);
  const raceRef = useRef<RaceState | null>(null);

  const pickColor = useCallback((color: string) => {
    setCustomColor(color);
    setHeroId("custom");
  }, []);

  const startRace = useCallback(
    (diff: Difficulty) => {
      setTrack(trackId);
      const hero = SUPERHERO_SKINS.find((s) => s.id === heroId);
      const nextRace = createRace(diff, {
        name: hero ? hero.name : "You",
        color: hero ? hero.color : customColor,
        accent: hero ? hero.accent : customColor,
      });
      raceRef.current = nextRace;
      setRace(nextRace);
      setCount(3);
      setPaused(false);
      setPhase("countdown");
    },
    [heroId, customColor, trackId]
  );

  const goMenu = useCallback(() => {
    raceRef.current = null;
    setRace(null);
    setCount(-1);
    setPaused(false);
    setPhase("menu");
  }, []);

  // countdown: 3 · 2 · 1 · GO
  useEffect(() => {
    if (phase !== "countdown") return;
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      setCount(n);
      if (n === 0) {
        clearInterval(iv);
        const r = raceRef.current;
        if (r) r.phase = "racing";
        setPhase("racing");
        setTimeout(() => setCount(-1), 900);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  const togglePause = useCallback(() => {
    const r = raceRef.current;
    if (!r || r.phase !== "racing") return;
    r.paused = !r.paused;
    setPaused(r.paused);
  }, []);

  const resetCar = useCallback(() => {
    const r = raceRef.current;
    if (r && r.phase === "racing") respawnCar(r.cars[r.playerIndex]);
  }, []);

  const cycleCamera = useCallback(() => {
    const r = raceRef.current;
    if (r) r.cameraMode = r.cameraMode === 0 ? 1 : 0;
  }, []);

  useKeyboard({ raceRef, onPause: togglePause, onReset: resetCar, onCamera: cycleCamera });

  const handleFinished = useCallback(() => setPhase("finished"), []);

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-[#8fd0ff]">
      <Canvas
        shadows="percentage"
        flat
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 60, near: 0.5, far: 1600, position: [160, 110, 160] }}
      >
        {race && <RaceView key={race.id} race={race} onFinished={handleFinished} />}
      </Canvas>

      {phase === "menu" && (
        <Menu
          difficulty={difficulty}
          onSelect={setDifficulty}
          onStart={() => startRace(difficulty)}
          trackId={trackId}
          onSelectTrack={setTrackId}
          heroId={heroId}
          onSelectHero={setHeroId}
          customColor={customColor}
          onSelectCustomColor={pickColor}
        />
      )}

      {(phase === "racing" || phase === "countdown") && race && (
        <Fragment key={race.id}>
          <HUD race={race} />
          <TouchControls raceRef={raceRef} />
        </Fragment>
      )}

      {phase === "countdown" && count > 0 && <Countdown n={count} />}
      {phase === "racing" && count === 0 && <Countdown n={0} />}

      {phase === "racing" && paused && race && (
        <PauseOverlay
          onResume={togglePause}
          onRestart={() => startRace(race.difficulty)}
          onMenu={goMenu}
        />
      )}

      {phase === "finished" && race && (
        <Results race={race} onRestart={() => startRace(race.difficulty)} onMenu={goMenu} />
      )}
    </div>
  );
}
