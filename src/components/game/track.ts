import * as THREE from "three";

export const ROAD_WIDTH = 14;
export const SAMPLE_COUNT = 800;

export interface TrackDef {
  id: string;
  name: string;
  points: Array<[number, number]>;
}

/** Every circuit in the game. All are simple closed curves (no self-intersections). */
export const TRACK_DEFS: TrackDef[] = [
  {
    id: "street",
    name: "Apex Street",
    points: [
      [0, 0],
      [60, 0],
      [100, -12],
      [132, -42],
      [140, -84],
      [126, -122],
      [92, -142],
      [52, -138],
      [26, -116],
      [12, -88],
      [-18, -76],
      [-48, -86],
      [-66, -114],
      [-98, -128],
      [-130, -112],
      [-142, -74],
      [-132, -34],
      [-108, -4],
      [-72, 8],
      [-36, 6],
    ],
  },
  {
    id: "speedring",
    name: "Speed Ring",
    points: [
      [-140, 0],
      [-140, -240],
      [140, -240],
      [140, 0],
    ],
  },
  {
    id: "canyon",
    name: "Canyon Loop",
    points: [
      [-130, -10],
      [-90, -150],
      [30, -210],
      [150, -150],
      [160, -10],
      [90, 90],
    ],
  },
  {
    id: "gp",
    name: "Grand Prix",
    points: [
      [-190, 60],
      [-160, -150],
      [-40, -260],
      [110, -240],
      [180, -110],
      [200, 40],
      [90, 110],
      [-60, 120],
    ],
  },
  {
    id: "tech",
    name: "Tight Tech",
    points: [
      [-60, 50],
      [-100, -50],
      [-50, -140],
      [40, -150],
      [110, -80],
      [90, 30],
      [10, 90],
    ],
  },
  {
    id: "triangle",
    name: "The Triangle",
    points: [
      [-140, -100],
      [140, -100],
      [0, 120],
    ],
  },
  {
    id: "diamond",
    name: "Diamond Run",
    points: [
      [-140, 0],
      [0, -160],
      [140, 0],
      [0, 160],
    ],
  },
  {
    id: "grandstand",
    name: "Grandstand",
    points: [
      [-150, -10],
      [-130, -140],
      [20, -170],
      [150, -90],
      [120, 60],
      [0, 120],
      [-120, 100],
    ],
  },
  {
    id: "harbor",
    name: "Harbor Circuit",
    points: [
      [-120, 90],
      [-180, -30],
      [-130, -170],
      [20, -190],
      [100, -100],
      [170, -90],
      [210, 20],
      [130, 120],
      [10, 160],
    ],
  },
  {
    id: "park",
    name: "Motorsport Park",
    points: [
      [-100, -30],
      [-160, -120],
      [-70, -230],
      [90, -210],
      [180, -90],
      [140, 40],
      [30, 100],
      [-70, 60],
    ],
  },
  {
    id: "rally",
    name: "Rally Cross",
    points: [
      [-210, 80],
      [-190, -150],
      [-60, -260],
      [140, -260],
      [230, -110],
      [170, 90],
      [40, 180],
      [-140, 180],
    ],
  },
  {
    id: "city",
    name: "City Loop",
    points: [
      [-120, -30],
      [-90, -140],
      [20, -170],
      [130, -110],
      [150, 20],
      [80, 120],
      [-60, 130],
    ],
  },
];

export interface TrackSample {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  /** unit vector pointing to the left of the travel direction */
  normal: THREE.Vector3;
  /** cumulative distance from the start line (m) */
  dist: number;
  /** 1 / corner radius (rad/m) */
  curvature: number;
}

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  samples: TrackSample[];
  length: number;
  spacing: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

function buildTrack(points: Array<[number, number]>): TrackData {
  const pts = points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
  const spaced = curve.getSpacedPoints(SAMPLE_COUNT);

  const samples: TrackSample[] = [];
  let dist = 0;
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const prev = spaced[(i - 1 + SAMPLE_COUNT) % SAMPLE_COUNT];
    const p = spaced[i];
    const next = spaced[(i + 1) % SAMPLE_COUNT];
    const tangent = new THREE.Vector3().subVectors(next, prev).normalize();
    const normal = new THREE.Vector3(tangent.z, 0, -tangent.x);
    if (i > 0) dist += p.distanceTo(spaced[i - 1]);
    samples.push({ pos: p.clone(), tangent, normal, dist, curvature: 0 });
  }
  const length = dist + samples[SAMPLE_COUNT - 1].pos.distanceTo(samples[0].pos);
  const spacing = length / SAMPLE_COUNT;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const a = samples[(i - 3 + SAMPLE_COUNT) % SAMPLE_COUNT].tangent;
    const b = samples[(i + 3) % SAMPLE_COUNT].tangent;
    samples[i].curvature = a.angleTo(b) / (spacing * 6);
  }

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const s of samples) {
    minX = Math.min(minX, s.pos.x);
    maxX = Math.max(maxX, s.pos.x);
    minZ = Math.min(minZ, s.pos.z);
    maxZ = Math.max(maxZ, s.pos.z);
  }

  return {
    curve,
    samples,
    length,
    spacing,
    bounds: { minX, maxX, minZ, maxZ },
  };
}

/**
 * The active track. It is live-binding — every module sees the currently
 * selected track, and anything that caches derived geometry (Road, minimap,
 * trees) must be remounted when it changes (RaceView/HUD are keyed by race id).
 */
export let TRACK: TrackData = buildTrack(TRACK_DEFS[0].points);

let activeTrackId = TRACK_DEFS[0].id;

/** Switch the active track. All subsequent races use it. */
export function setTrack(id: string) {
  const def = TRACK_DEFS.find((t) => t.id === id) ?? TRACK_DEFS[0];
  if (def.id === activeTrackId) return;
  activeTrackId = def.id;
  TRACK = buildTrack(def.points);
}

export function nearestSampleIndex(pos: THREE.Vector3, hint: number): number {
  const { samples } = TRACK;
  const n = samples.length;
  let best = 0;
  let bestD = Infinity;
  if (hint < 0) {
    for (let i = 0; i < n; i++) {
      const dx = samples[i].pos.x - pos.x;
      const dz = samples[i].pos.z - pos.z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  } else {
    for (let k = -45; k <= 45; k++) {
      const i = (hint + k + n) % n;
      const dx = samples[i].pos.x - pos.x;
      const dz = samples[i].pos.z - pos.z;
      const d = dx * dx + dz * dz;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
  }
  return best;
}

export interface TrackPoint {
  pos: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
}

const _pt: TrackPoint = {
  pos: new THREE.Vector3(),
  tangent: new THREE.Vector3(),
  normal: new THREE.Vector3(),
};

/** Interpolated point on the centerline at distance `s` (wraps around the lap). */
export function pointAtDist(s: number): TrackPoint {
  const { samples, spacing } = TRACK;
  const n = samples.length;
  let f = (s / spacing) % n;
  if (f < 0) f += n;
  const i0 = Math.floor(f) % n;
  const i1 = (i0 + 1) % n;
  const t = f - Math.floor(f);
  const a = samples[i0];
  const b = samples[i1];
  _pt.pos.lerpVectors(a.pos, b.pos, t);
  _pt.tangent.lerpVectors(a.tangent, b.tangent, t).normalize();
  _pt.normal.lerpVectors(a.normal, b.normal, t).normalize();
  return _pt;
}

/** Max curvature of the centerline between two arc distances (may wrap past the lap end). */
export function maxCurvatureBetween(s0: number, s1: number): number {
  const { samples, spacing } = TRACK;
  const n = samples.length;
  let k = 0;
  const i0 = Math.floor(s0 / spacing);
  const i1 = Math.floor(s1 / spacing);
  for (let i = i0; i <= i1; i += 3) {
    k = Math.max(k, samples[((i % n) + n) % n].curvature);
  }
  return k;
}

/* ---------- geometry builders ---------- */

export function buildRoadGeometry(): THREE.BufferGeometry {
  const { samples } = TRACK;
  const n = samples.length;
  const half = ROAD_WIDTH / 2;
  const positions = new Float32Array((n + 1) * 2 * 3);
  const uvs = new Float32Array((n + 1) * 2 * 2);
  const index: number[] = [];
  for (let i = 0; i <= n; i++) {
    const s = samples[i % n];
    const o = i * 6;
    positions[o] = s.pos.x + s.normal.x * half;
    positions[o + 1] = 0.01;
    positions[o + 2] = s.pos.z + s.normal.z * half;
    positions[o + 3] = s.pos.x - s.normal.x * half;
    positions[o + 4] = 0.01;
    positions[o + 5] = s.pos.z - s.normal.z * half;
    const u = i * 4;
    uvs[u] = 0;
    uvs[u + 1] = s.dist / 6;
    uvs[u + 2] = 1;
    uvs[u + 3] = s.dist / 6;
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

export function buildCurbGeometry(side: 1 | -1): THREE.BufferGeometry {
  const { samples } = TRACK;
  const n = samples.length;
  const half = ROAD_WIDTH / 2;
  const inner = side * (half - 0.05);
  const outer = side * (half + 1.5);
  const positions = new Float32Array((n + 1) * 2 * 3);
  const colors = new Float32Array((n + 1) * 2 * 3);
  const index: number[] = [];
  const red = [0.85, 0.2, 0.2];
  const white = [0.95, 0.95, 0.95];
  for (let i = 0; i <= n; i++) {
    const s = samples[i % n];
    const o = i * 6;
    positions[o] = s.pos.x + s.normal.x * inner;
    positions[o + 1] = 0.02;
    positions[o + 2] = s.pos.z + s.normal.z * inner;
    positions[o + 3] = s.pos.x + s.normal.x * outer;
    positions[o + 4] = 0.02;
    positions[o + 5] = s.pos.z + s.normal.z * outer;
    const c = Math.floor(s.dist / 4) % 2 === 0 ? red : white;
    const co = i * 6;
    colors[co] = c[0];
    colors[co + 1] = c[1];
    colors[co + 2] = c[2];
    colors[co + 3] = c[0];
    colors[co + 4] = c[1];
    colors[co + 5] = c[2];
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

export function buildStartLineGeometry(): THREE.BufferGeometry {
  const p0 = pointAtDist(-1.4);
  const p1 = pointAtDist(1.4);
  const half = ROAD_WIDTH / 2 - 0.3;
  const y = 0.035;
  const pos = new Float32Array([
    p0.pos.x + p0.normal.x * half, y, p0.pos.z + p0.normal.z * half,
    p0.pos.x - p0.normal.x * half, y, p0.pos.z - p0.normal.z * half,
    p1.pos.x + p1.normal.x * half, y, p1.pos.z + p1.normal.z * half,
    p1.pos.x - p1.normal.x * half, y, p1.pos.z - p1.normal.z * half,
  ]);
  const uvs = new Float32Array([0, 0, 8, 0, 0, 2, 8, 2]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex([0, 1, 2, 1, 3, 2]);
  geo.computeVertexNormals();
  return geo;
}

export function makeCheckerTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 16;
  const ctx = c.getContext("2d")!;
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (r + col) % 2 === 0 ? "#111111" : "#f5f5f5";
      ctx.fillRect(col * 8, r * 8, 8, 8);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export interface TreeInst {
  x: number;
  z: number;
  s: number;
}

export function scatterTrees(count: number): TreeInst[] {
  const { samples } = TRACK;
  const out: TreeInst[] = [];
  let attempts = 0;
  while (out.length < count && attempts < 4000) {
    attempts++;
    const x = (Math.random() * 2 - 1) * 300;
    const z = (Math.random() * 2 - 1) * 300 - 70;
    let minD2 = Infinity;
    for (let i = 0; i < samples.length; i += 8) {
      const dx = samples[i].pos.x - x;
      const dz = samples[i].pos.z - z;
      minD2 = Math.min(minD2, dx * dx + dz * dz);
    }
    if (minD2 < 20 * 20 || minD2 > 330 * 330) continue;
    let ok = true;
    for (const t of out) {
      const dx = t.x - x;
      const dz = t.z - z;
      if (dx * dx + dz * dz < 8 * 8) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    out.push({ x, z, s: 0.8 + Math.random() * 1.2 });
  }
  return out;
}
