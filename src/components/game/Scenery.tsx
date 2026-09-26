"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  ROAD_WIDTH,
  buildCurbGeometry,
  buildRoadGeometry,
  buildStartLineGeometry,
  makeCheckerTexture,
  pointAtDist,
  scatterTrees,
} from "./track";

export function Road() {
  const road = useMemo(() => buildRoadGeometry(), []);
  const curbL = useMemo(() => buildCurbGeometry(1), []);
  const curbR = useMemo(() => buildCurbGeometry(-1), []);
  const checker = useMemo(() => makeCheckerTexture(), []);
  const startLine = useMemo(() => buildStartLineGeometry(), []);
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial color="#3a3d42" roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={curbL} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={curbR} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={startLine}>
        <meshBasicMaterial map={checker} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Ground() {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, -70]} receiveShadow>
      <circleGeometry args={[520, 64]} />
      <meshStandardMaterial color="#4e8c3a" roughness={1} />
    </mesh>
  );
}

export function StartArch() {
  const checker = useMemo(() => makeCheckerTexture(), []);
  const p = pointAtDist(0);
  const rot = Math.atan2(p.tangent.x, p.tangent.z);
  const half = ROAD_WIDTH / 2 + 1.6;
  return (
    <group position={[p.pos.x, 0, p.pos.z]} rotation-y={rot}>
      <mesh position={[-half, 3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 6, 10]} />
        <meshStandardMaterial color="#e2e6ea" roughness={0.6} />
      </mesh>
      <mesh position={[half, 3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 6, 10]} />
        <meshStandardMaterial color="#e2e6ea" roughness={0.6} />
      </mesh>
      <mesh position={[0, 6.4, 0]} castShadow>
        <boxGeometry args={[half * 2 + 1, 1.3, 1.4]} />
        <meshStandardMaterial map={checker} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Trees() {
  const trees = useMemo(() => scatterTrees(80), []);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6), []);
  const leafGeo = useMemo(() => new THREE.ConeGeometry(1.5, 3.6, 7), []);
  const trunkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6b4a2f", roughness: 1 }),
    []
  );
  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2f6e2f", roughness: 1 }),
    []
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3();
    trees.forEach((t, i) => {
      q.setFromAxisAngle(up, (i * 2.399) % (Math.PI * 2));
      s.set(t.s, t.s, t.s);
      p.set(t.x, 0.8 * t.s, t.z);
      m.compose(p, q, s);
      trunkRef.current?.setMatrixAt(i, m);
      p.set(t.x, 3.2 * t.s, t.z);
      m.compose(p, q, s);
      leafRef.current?.setMatrixAt(i, m);
    });
    if (trunkRef.current) trunkRef.current.instanceMatrix.needsUpdate = true;
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trees.length]} castShadow />
      <instancedMesh ref={leafRef} args={[leafGeo, leafMat, trees.length]} castShadow />
    </group>
  );
}
