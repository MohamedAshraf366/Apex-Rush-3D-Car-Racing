"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { CarState } from "./types";

const WHEEL_RADIUS = 0.34;

interface WheelGroupProps {
  position: [number, number, number];
  spinRef: RefObject<(THREE.Group | null)[]>;
  wheelIndex: number;
  steerRef?: RefObject<THREE.Group | null>;
}

const WheelGroup = function WheelGroup({ position, spinRef, wheelIndex, steerRef }: WheelGroupProps) {
  return (
    <group ref={steerRef ?? undefined} position={position}>
      <group
        ref={(g) => {
          spinRef.current[wheelIndex] = g;
        }}
      >
        <mesh rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 14]} />
          <meshStandardMaterial color="#191b1f" roughness={0.85} />
        </mesh>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.19, 0.19, 0.32, 10]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

export function CarView({ car }: { car: CarState }) {
  const group = useRef<THREE.Group>(null);
  const steerL = useRef<THREE.Group>(null);
  const steerR = useRef<THREE.Group>(null);
  const spins = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const wheelSpin = useRef(0);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.position.set(car.pos.x, 0, car.pos.z);
    g.rotation.y = car.heading;
    wheelSpin.current -= (car.speed * delta) / WHEEL_RADIUS;
    for (const s of spins.current) if (s) s.rotation.x = wheelSpin.current;
    const sv = -car.steer * 0.42;
    if (steerL.current) steerL.current.rotation.y = sv;
    if (steerR.current) steerR.current.rotation.y = sv;
  });

  return (
    <group ref={group}>
      {/* main body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.9, 0.55, 4.4]} />
        <meshStandardMaterial color={car.color} metalness={0.5} roughness={0.32} />
      </mesh>
      {/* nose */}
      <mesh position={[0, 0.42, 2.35]} castShadow>
        <boxGeometry args={[1.7, 0.32, 0.7]} />
        <meshStandardMaterial color={car.color} metalness={0.5} roughness={0.32} />
      </mesh>
      {/* body accent stripe */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.02, 0.05, 4.42]} />
        <meshStandardMaterial color={car.accent} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 1.06, -0.25]} castShadow>
        <boxGeometry args={[1.45, 0.5, 1.9]} />
        <meshStandardMaterial color="#15181d" metalness={0.8} roughness={0.18} />
      </mesh>
      {/* rear wing */}
      <mesh position={[0, 1.12, -2.05]} castShadow>
        <boxGeometry args={[1.8, 0.09, 0.55]} />
        <meshStandardMaterial color={car.color} metalness={0.5} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.92, -2.02]}>
        <boxGeometry args={[1.5, 0.3, 0.12]} />
        <meshStandardMaterial color="#20232a" roughness={0.6} />
      </mesh>
      {/* taillight */}
      <mesh position={[0, 0.62, -2.21]}>
        <boxGeometry args={[1.5, 0.14, 0.06]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={1.4} />
      </mesh>
      {/* headlights */}
      <mesh position={[-0.55, 0.5, 2.72]}>
        <boxGeometry args={[0.4, 0.12, 0.06]} />
        <meshStandardMaterial color="#fff6d8" emissive="#fff2c0" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.55, 0.5, 2.72]}>
        <boxGeometry args={[0.4, 0.12, 0.06]} />
        <meshStandardMaterial color="#fff6d8" emissive="#fff2c0" emissiveIntensity={1.2} />
      </mesh>
      {/* wheels: front pair steers, all spin */}
      <WheelGroup position={[-0.88, WHEEL_RADIUS, 1.42]} spinRef={spins} wheelIndex={0} steerRef={steerL} />
      <WheelGroup position={[0.88, WHEEL_RADIUS, 1.42]} spinRef={spins} wheelIndex={1} steerRef={steerR} />
      <WheelGroup position={[-0.88, WHEEL_RADIUS, -1.42]} spinRef={spins} wheelIndex={2} />
      <WheelGroup position={[0.88, WHEEL_RADIUS, -1.42]} spinRef={spins} wheelIndex={3} />
    </group>
  );
}
