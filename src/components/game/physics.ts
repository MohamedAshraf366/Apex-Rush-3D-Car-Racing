import * as THREE from "three";
import { ROAD_WIDTH, nearestSampleIndex, pointAtDist, TRACK } from "./track";
import { driveAI } from "./ai";
import type { AIParams, BoostPickup, CarAI, CarSkin, CarState, Difficulty, Obstacle, RaceState, Standing } from "./types";

export const TOTAL_LAPS = 3;

const PLAYER_PARAMS = {
  maxSpeed: 47,
  accel: 26,
  brakeDecel: 36,
  reverseMax: 12,
  turnRate: 2.35,
};

const CAR_RADIUS = 1.35;

export const AI_BY_DIFFICULTY: Record<Difficulty, AIParams> = {
  easy: { speedMul: 0.66, latAccel: 20, lookBase: 7, lookSpeed: 0.22, wobble: 0.16, gain: 1.7 },
  medium: { speedMul: 0.83, latAccel: 32, lookBase: 9, lookSpeed: 0.3, wobble: 0.05, gain: 2.2 },
  hard: { speedMul: 0.99, latAccel: 47, lookBase: 11, lookSpeed: 0.38, wobble: 0, gain: 2.7 },
};

const AI_META: Array<{ name: string; color: string; offsetLat: number; speedJit: number; gripJit: number }> = [
  { name: "Blaze", color: "#2f7bff", offsetLat: -2.6, speedJit: 0.97, gripJit: 0.94 },
  { name: "Volt", color: "#ffd028", offsetLat: 0, speedJit: 1.0, gripJit: 1.0 },
  { name: "Rex", color: "#22c55e", offsetLat: 2.6, speedJit: 0.985, gripJit: 0.97 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** obstacles per difficulty: low in easy, many in hard */
const OBSTACLE_COUNTS: Record<Difficulty, number> = { easy: 8, medium: 15, hard: 24 };

function makeObstacles(difficulty: Difficulty): Obstacle[] {
  const n = OBSTACLE_COUNTS[difficulty];
  const len = TRACK.length;
  // keep the lap start (and the grid behind it) clear
  const start = 60;
  const end = len - 60;
  const span = end - start;
  // keep wider obstacles a bit closer to the centerline so their larger
  // collision circles still leave room between them and the outer wall
  const half = ROAD_WIDTH / 2 - 2.0;
  const out: Obstacle[] = [];
  let id = 1;
  for (let i = 0; i < n; i++) {
    const t = (i + (0.25 + Math.random() * 0.5)) / n;
    const dist = Math.min(end, Math.max(start, start + span * t));
    const kind = difficulty === "easy" || Math.random() < 0.55 ? "cone" : "tire";
    const lateral = (Math.random() * 2 - 1) * half;
    const p = pointAtDist(dist);
    out.push({
      id: id++,
      kind,
      radius: kind === "cone" ? 0.75 : 1.2,
      pos: new THREE.Vector3(p.pos.x + p.normal.x * lateral, 0, p.pos.z + p.normal.z * lateral),
    });
  }
  return out;
}

/** seconds a lightning boost lasts (max 16 pickups per race) */
export const BOOST_DURATION = 4;

/** random 8..16 boost pads spawn each race, at random spots on the circuit */
function makeBoosts(obstacles: Obstacle[]): BoostPickup[] {
  const len = TRACK.length;
  const count = 8 + Math.floor(Math.random() * 9); // 8..16, never more than 16
  const out: BoostPickup[] = [];
  let id = 1;
  let attempts = 0;
  while (out.length < count && attempts < 500) {
    attempts++;
    const dist = 30 + Math.random() * (len - 75);
    const lateral = (Math.random() * 2 - 1) * (ROAD_WIDTH / 2 - 1.6);
    const p = pointAtDist(dist);
    const bx = p.pos.x + p.normal.x * lateral;
    const bz = p.pos.z + p.normal.z * lateral;

    // keep clear of obstacles (don't hide a spark inside a cone / tire wall)
    let minObs = Infinity;
    for (const ob of obstacles) {
      const dx = ob.pos.x - bx;
      const dz = ob.pos.z - bz;
      const d = Math.hypot(dx, dz);
      if (d < minObs) minObs = d;
    }
    if (minObs < 3) continue;

    // keep clear of other boosts
    let minB = Infinity;
    for (const b of out) {
      const dx = b.pos.x - bx;
      const dz = b.pos.z - bz;
      const d = Math.hypot(dx, dz);
      if (d < minB) minB = d;
    }
    if (minB < 12) continue;

    out.push({ id: id++, pos: new THREE.Vector3(bx, 0, bz), radius: 1.2, collected: false });
  }
  return out;
}

let raceCounter = 0;

function makeCar(
  id: number,
  name: string,
  color: string,
  accent: string,
  isPlayer: boolean,
  ai: CarAI | null
): CarState {
  return {
    id,
    name,
    color,
    accent,
    isPlayer,
    ai,
    pos: new THREE.Vector3(),
    heading: 0,
    speed: 0,
    steer: 0,
    input: { throttle: 0, brake: 0, steer: 0 },
    sampleIndex: 0,
    frac: 0,
    lateral: 0,
    offTrack: false,
    lap: 0,
    lapTimes: [],
    lapStart: 0,
    bestLap: null,
    finished: false,
    finishTime: null,
    rank: id + 1,
    boostTime: 0,
    wrongWayTime: 0,
    stuckTime: 0,
  };
}

function placeOnGrid(car: CarState, slot: number) {
  const s = TRACK.length - 12 - slot * 8;
  const p = pointAtDist(s);
  const lat = slot % 2 === 0 ? -3.2 : 3.2;
  car.pos.set(p.pos.x + p.normal.x * lat, 0, p.pos.z + p.normal.z * lat);
  car.heading = Math.atan2(p.tangent.x, p.tangent.z);
  car.speed = 0;
  car.steer = 0;
  car.sampleIndex = nearestSampleIndex(car.pos, -1);
  car.frac = s / TRACK.length;
  car.input.throttle = 0;
  car.input.brake = 0;
  car.input.steer = 0;
}

export function createRace(difficulty: Difficulty, player: CarSkin): RaceState {
  const base = AI_BY_DIFFICULTY[difficulty];
  const cars: CarState[] = [];
  for (let i = 0; i < 3; i++) {
    const m = AI_META[i];
    cars.push(
      makeCar(i, m.name, m.color, m.color, false, {
        ...base,
        speedMul: base.speedMul * m.speedJit,
        latAccel: base.latAccel * m.gripJit,
        offsetLat: m.offsetLat,
        seed: Math.random() * 100,
      })
    );
  }
  cars.push(makeCar(3, player.name, player.color, player.accent, true, null));

  // AI cars occupy grid slots 0-2, player starts from the back of the grid
  cars.forEach((car, slot) => placeOnGrid(car, slot));

  const obstacles = makeObstacles(difficulty);

  const race: RaceState = {
    id: ++raceCounter,
    difficulty,
    phase: "countdown",
    paused: false,
    time: 0,
    cameraMode: 0,
    cameraSnap: true,
    controls: { throttle: 0, brake: 0, steer: 0 },
    cars,
    playerIndex: 3,
    standings: [],
    finishedAt: null,
    obstacles,
    boosts: makeBoosts(obstacles),
  };
  updateStandings(race);
  return race;
}

export function respawnCar(car: CarState) {
  const smp = TRACK.samples[car.sampleIndex];
  car.pos.set(smp.pos.x, 0, smp.pos.z);
  car.heading = Math.atan2(smp.tangent.x, smp.tangent.z);
  car.speed = 0;
  car.input.throttle = 0;
  car.input.brake = 0;
  car.input.steer = 0;
  car.wrongWayTime = 0;
  car.stuckTime = 0;
}

export function progressOf(car: CarState): number {
  return car.lap * TRACK.length + car.frac * TRACK.length;
}

function stepCar(car: CarState, dt: number) {
  // off the racing surface = outer curb edge: rumble-strip-like grip loss
  const offRacing = car.offTrack;
  const boosted = car.boostTime > 0;
  const maxSpeed =
    PLAYER_PARAMS.maxSpeed * (offRacing ? 0.72 : 1) * (car.ai ? car.ai.speedMul : 1) * (boosted ? 1.35 : 1);
  const accel = PLAYER_PARAMS.accel * (offRacing ? 0.8 : 1) * (boosted ? 1.9 : 1);
  const v = car.speed;
  let a = 0;

  if (car.input.throttle > 0 && v < maxSpeed) {
    a += accel * car.input.throttle * (1 - Math.max(v, 0) / maxSpeed);
  }
  if (car.input.brake > 0) {
    if (v > 0.6) {
      a -= PLAYER_PARAMS.brakeDecel * car.input.brake * (offRacing ? 0.9 : 1);
    } else {
      a -= accel * 0.55 * car.input.brake; // reverse
    }
  }
  // drag + rolling resistance
  a -= v * 0.04;
  if (Math.abs(v) > 0.5) a -= Math.sign(v) * 1.2;

  car.speed = v + a * dt;
  if (Math.abs(car.speed) < 0.15 && car.input.throttle === 0) car.speed = 0;
  car.speed = clamp(car.speed, -PLAYER_PARAMS.reverseMax, PLAYER_PARAMS.maxSpeed + 2);

  // steering: signed factor makes reversing steer naturally
  const sf = clamp(car.speed / 6, -1, 1) / (1 + Math.abs(car.speed) * 0.012);
  car.heading -= car.input.steer * PLAYER_PARAMS.turnRate * (offRacing ? 0.9 : 1) * sf * dt;
  car.steer += (car.input.steer - car.steer) * Math.min(1, dt * 8);

  const fx = Math.sin(car.heading);
  const fz = Math.cos(car.heading);
  car.pos.x += fx * car.speed * dt;
  car.pos.z += fz * car.speed * dt;

  if (car.boostTime > 0) car.boostTime = Math.max(0, car.boostTime - dt);
}

function resolveCollisions(cars: CarState[]) {
  const minD = CAR_RADIUS * 2;
  for (let i = 0; i < cars.length; i++) {
    for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i];
      const b = cars[j];
      const dx = b.pos.x - a.pos.x;
      const dz = b.pos.z - a.pos.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > minD * minD || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const nx = dx / d;
      const nz = dz / d;
      const push = (minD - d) / 2;
      a.pos.x -= nx * push;
      a.pos.z -= nz * push;
      b.pos.x += nx * push;
      b.pos.z += nz * push;
      a.speed *= 0.985;
      b.speed *= 0.985;
    }
  }
}

function resolveObstacles(car: CarState, obstacles: Obstacle[]) {
  const carR = 1.15;
  for (const ob of obstacles) {
    const dx = car.pos.x - ob.pos.x;
    const dz = car.pos.z - ob.pos.z;
    const rr = ob.radius + carR;
    const d2 = dx * dx + dz * dz;
    if (d2 > rr * rr || d2 === 0) continue;
    const d = Math.sqrt(d2);
    const nx = dx / d;
    const nz = dz / d;
    car.pos.x += nx * (rr - d);
    car.pos.z += nz * (rr - d);

    const fx = Math.sin(car.heading);
    const fz = Math.cos(car.heading);
    const vx = fx * car.speed;
    const vz = fz * car.speed;
    const into = vx * nx + vz * nz; // velocity pushing into the obstacle
    if (into > 0) {
      const hit = Math.min(1, into / 14);
      car.speed = Math.hypot(vx - into * nx, vz - into * nz) * (1 - 0.55 * hit);
      // kick the nose around the obstacle on harder contact
      car.heading += Math.sign(fz * nx - fx * nz) * 0.18 * hit;
    }
  }
}

function collectBoosts(car: CarState, boosts: BoostPickup[]) {
  const rr = 1.2 + 1.15; // pickup radius + car radius
  for (const b of boosts) {
    if (b.collected) continue;
    const dx = car.pos.x - b.pos.x;
    const dz = car.pos.z - b.pos.z;
    if (dx * dx + dz * dz <= rr * rr) {
      b.collected = true;
      car.boostTime = BOOST_DURATION;
    }
  }
}

function updateTrackState(car: CarState, race: RaceState, dt: number) {
  const { samples, length } = TRACK;
  car.sampleIndex = nearestSampleIndex(car.pos, car.sampleIndex);
  const smp = samples[car.sampleIndex];
  const relX = car.pos.x - smp.pos.x;
  const relZ = car.pos.z - smp.pos.z;
  car.lateral = relX * smp.normal.x + relZ * smp.normal.z;

  const half = ROAD_WIDTH / 2;
  // outer half of the curb counts as off the racing surface (less grip)
  car.offTrack = Math.abs(car.lateral) > half + 0.9;

  // hidden wall at the outer edge of the curb: cars can never leave the track
  const wall = half + 1.5;
  if (Math.abs(car.lateral) > wall) {
    const sgn = Math.sign(car.lateral);
    const nx = smp.normal.x * sgn; // outward-facing wall normal
    const nz = smp.normal.z * sgn;
    car.pos.x = smp.pos.x + smp.normal.x * wall * sgn;
    car.pos.z = smp.pos.z + smp.normal.z * wall * sgn;

    const fx = Math.sin(car.heading);
    const fz = Math.cos(car.heading);
    const vx = fx * car.speed;
    const vz = fz * car.speed;
    const into = vx * nx + vz * nz; // velocity pushing into the wall
    if (into > 0) {
      // slide along the wall: drop the into-wall velocity component
      const svx = vx - into * nx;
      const svz = vz - into * nz;
      const hit = Math.min(1, into / 12); // 0 = brush, 1 = hard slam
      car.speed = Math.hypot(svx, svz) * (1 - 0.25 * hit);
      // kick the nose away from the wall on harder contact
      if (hit > 0.15) {
        const side = fz * nx - fx * nz; // cross(forward, wallNormal).y
        const kick = hit * 0.5;
        car.heading -= Math.sign(side) * kick;
      }
    }
  }

  // lap crossing detection
  if (!car.finished) {
    const prevFrac = car.frac;
    const frac = smp.dist / length;
    if (prevFrac > 0.9 && frac < 0.1) {
      car.lap += 1;
      if (car.lap >= 1) {
        if (car.lap > 1) {
          const lapTime = race.time - car.lapStart;
          car.lapTimes.push(lapTime);
          if (car.bestLap == null || lapTime < car.bestLap) car.bestLap = lapTime;
        }
        car.lapStart = race.time;
        if (car.lap > TOTAL_LAPS) {
          car.finished = true;
          car.finishTime = race.time;
        }
      }
    } else if (prevFrac < 0.1 && frac > 0.9) {
      car.lap -= 1;
    }
    car.frac = frac;
  }

  // wrong way detection
  const fwdDot = Math.sin(car.heading) * smp.tangent.x + Math.cos(car.heading) * smp.tangent.z;
  if (fwdDot < -0.2 && Math.abs(car.speed) > 3) {
    car.wrongWayTime += dt;
  } else {
    car.wrongWayTime = 0;
  }

  // stuck off track -> auto respawn
  if (car.offTrack && Math.abs(car.speed) < 3 && car.input.throttle > 0) {
    car.stuckTime += dt;
    if (car.stuckTime > 4) respawnCar(car);
  } else {
    car.stuckTime = 0;
  }
}

export function updateStandings(race: RaceState) {
  const order = [...race.cars].sort((a, b) => {
    if (a.finished && b.finished) return (a.finishTime ?? 0) - (b.finishTime ?? 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return progressOf(b) - progressOf(a);
  });
  order.forEach((c, i) => {
    c.rank = i + 1;
  });
}

function computeStandings(race: RaceState): Standing[] {
  updateStandings(race);
  return [...race.cars]
    .sort((a, b) => a.rank - b.rank)
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      isPlayer: c.isPlayer,
      rank: c.rank,
      finished: c.finished,
      finishTime: c.finishTime,
      bestLap: c.bestLap,
      lapsDone: Math.max(0, Math.min(c.lap - 1, TOTAL_LAPS)),
    }));
}

export function stepRace(race: RaceState, dt: number) {
  race.time += dt;
  for (const car of race.cars) {
    if (car.finished) {
      // coast to a stop after the flag
      car.input.throttle = 0;
      car.input.brake = 0.4;
      car.input.steer = 0;
    } else if (car.isPlayer) {
      car.input.throttle = race.controls.throttle;
      car.input.brake = race.controls.brake;
      car.input.steer = race.controls.steer;
    } else {
      driveAI(car, race);
    }
    stepCar(car, dt);
  }
  resolveCollisions(race.cars);
  for (const car of race.cars) resolveObstacles(car, race.obstacles);
  for (const car of race.cars) collectBoosts(car, race.boosts);
  for (const car of race.cars) updateTrackState(car, race, dt);
  updateStandings(race);

  const player = race.cars[race.playerIndex];
  if (player.finished && race.phase === "racing") {
    race.phase = "finished";
    race.finishedAt = race.time;
    race.standings = computeStandings(race);
  }
}

export function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s < 10 ? "0" : ""}${s.toFixed(2)}`;
}
