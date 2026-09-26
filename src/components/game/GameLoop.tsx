"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { stepRace } from "./physics";
import type { RaceState } from "./types";

const STEP = 1 / 60;

export function GameLoop({
  race,
  lightRef,
  onFinished,
}: {
  race: RaceState;
  lightRef: RefObject<THREE.DirectionalLight | null>;
  onFinished: () => void;
}) {
  const { camera } = useThree();
  const acc = useRef(0);
  const notified = useRef(false);
  const camPos = useRef(new THREE.Vector3(0, 60, 160));
  const camLook = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const cameraSnap = useRef(race.cameraSnap);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.1);

    // fixed-timestep physics
    if (race.phase === "racing" && !race.paused) {
      acc.current += d;
      let n = 0;
      while (acc.current >= STEP && n < 8) {
        stepRace(race, STEP);
        acc.current -= STEP;
        n++;
      }
      if (n >= 8) acc.current = 0;
    }
    if (!notified.current && race.phase === "finished") {
      notified.current = true;
      onFinished();
    }

    const player = race.cars[race.playerIndex];
    const fx = Math.sin(player.heading);
    const fz = Math.cos(player.heading);

    if (race.cameraMode === 0) {
      desired.current.set(player.pos.x - fx * 10.5, 4.8, player.pos.z - fz * 10.5);
      lookAt.current.set(player.pos.x + fx * 10, 1.6, player.pos.z + fz * 10);
    } else {
      desired.current.set(player.pos.x - fx * 26, 17, player.pos.z - fz * 26);
      lookAt.current.set(player.pos.x + fx * 4, 0, player.pos.z + fz * 4);
    }
    if (cameraSnap.current) {
      camPos.current.copy(desired.current);
      camLook.current.copy(lookAt.current);
      cameraSnap.current = false;
    } else {
      camPos.current.lerp(desired.current, 1 - Math.exp(-6 * d));
      camLook.current.lerp(lookAt.current, 1 - Math.exp(-10 * d));
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);

    // keep the shadow frustum centered on the player
    const light = lightRef.current;
    if (light) {
      light.position.set(player.pos.x + 60, 95, player.pos.z + 35);
      light.target.position.set(player.pos.x, 0, player.pos.z);
      light.target.updateMatrixWorld();
    }
  });

  return null;
}
