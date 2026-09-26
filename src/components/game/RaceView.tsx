"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Ground, Road, StartArch, Trees } from "./Scenery";
import { CarView } from "./CarView";
import { ObstaclesView } from "./Obstacles";
import { BoostsView } from "./Boosts";
import { GameLoop } from "./GameLoop";
import type { RaceState } from "./types";

export function RaceView({ race, onFinished }: { race: RaceState; onFinished: () => void }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  return (
    <>
      <color attach="background" args={["#8fd0ff"]} />
      <fog attach="fog" args={["#8fd0ff", 150, 480]} />
      <hemisphereLight args={["#dceeff", "#3f6f34", 0.75]} />
      <directionalLight
        ref={lightRef}
        castShadow
        intensity={1.7}
        position={[80, 120, 40]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
        shadow-camera-near={10}
        shadow-camera-far={400}
        shadow-bias={-0.0002}
        shadow-normalBias={0.5}
      />
      <Ground />
      <Road />
      <StartArch />
      <Trees />
      <ObstaclesView obstacles={race.obstacles} />
      <BoostsView boosts={race.boosts} />
      {race.cars.map((car) => (
        <CarView key={car.id} car={car} />
      ))}
      <GameLoop race={race} lightRef={lightRef} onFinished={onFinished} />
    </>
  );
}
