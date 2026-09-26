"use client";

import { useRef } from "react";
import type * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { BoostPickup } from "./types";

function Boost({ b }: { b: BoostPickup }) {
  const group = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.position.y = 0.5 + Math.sin(t * 3 + b.id) * 0.18;
      group.current.rotation.y = t * 1.6;
    }
    const om = orb.current?.material as THREE.MeshStandardMaterial | undefined;
    if (om) om.emissiveIntensity = 1.6 + Math.sin(t * 7 + b.id) * 0.9;
    const rm = ring.current?.material as THREE.MeshStandardMaterial | undefined;
    if (rm) rm.emissiveIntensity = 1.2 + Math.sin(t * 5 + b.id) * 0.7;
  });

  return (
    <group position={[b.pos.x, 0, b.pos.z]}>
      <group ref={group}>
        <mesh ref={orb} position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.3, 14, 14]} />
          <meshStandardMaterial color="#d9f7ff" emissive="#59d7ff" emissiveIntensity={1.8} />
        </mesh>
        <mesh ref={ring} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.5, 0.045, 8, 26]} />
          <meshStandardMaterial color="#fff3c4" emissive="#ffd23f" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation-y={Math.PI / 4}>
          <boxGeometry args={[0.1, 0.1, 0.42]} />
          <meshStandardMaterial color="#fff6d8" emissive="#ffe066" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation-y={-Math.PI / 4}>
          <boxGeometry args={[0.1, 0.1, 0.42]} />
          <meshStandardMaterial color="#fff6d8" emissive="#ffe066" emissiveIntensity={1.8} />
        </mesh>
      </group>
    </group>
  );
}

export function BoostsView({ boosts }: { boosts: BoostPickup[] }) {
  return (
    <>
      {boosts.map((b) => !b.collected && <Boost key={b.id} b={b} />)}
    </>
  );
}