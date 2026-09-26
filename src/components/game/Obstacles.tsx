"use client";

import type { Obstacle } from "./types";

function Cone({ o }: { o: Obstacle }) {
  return (
    <group position={[o.pos.x, 0, o.pos.z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.42, 1.0, 12]} />
        <meshStandardMaterial color="#ff5a1f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.24, 0.32, 0.26, 12]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.6} />
      </mesh>
    </group>
  );
}

function TireStack({ o }: { o: Obstacle }) {
  return (
    <group position={[o.pos.x, 0, o.pos.z]}>
      {[0.16, 0.5, 0.84].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[0.5, 0.17, 8, 16]} />
          <meshStandardMaterial color="#131416" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function ObstaclesView({ obstacles }: { obstacles: Obstacle[] }) {
  return (
    <>
      {obstacles.map((o) =>
        o.kind === "cone" ? <Cone key={o.id} o={o} /> : <TireStack key={o.id} o={o} />
      )}
    </>
  );
}