import { maxCurvatureBetween, pointAtDist, TRACK } from "./track";
import type { CarState, RaceState } from "./types";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Arcade AI: aim at a look-ahead point on the centerline, pick a cornering
 * speed from the curvature ahead, brake/throttle to match it, and sidestep
 * cars blocking the way.
 */
export function driveAI(car: CarState, race: RaceState) {
  const ai = car.ai!;
  const s = TRACK.samples[car.sampleIndex].dist;
  const look = ai.lookBase + Math.abs(car.speed) * ai.lookSpeed;
  const p = pointAtDist(s + look);
  const lat = ai.offsetLat * Math.min(1, look / 25);
  const tx = p.pos.x + p.normal.x * lat;
  const tz = p.pos.z + p.normal.z * lat;

  const dx = tx - car.pos.x;
  const dz = tz - car.pos.z;
  let dH = Math.atan2(dx, dz) - car.heading;
  while (dH > Math.PI) dH -= 2 * Math.PI;
  while (dH < -Math.PI) dH += 2 * Math.PI;
  let steer = -dH * ai.gain;

  if (ai.wobble > 0) steer += Math.sin(race.time * 1.4 + ai.seed) * ai.wobble;

  const fx = Math.sin(car.heading);
  const fz = Math.cos(car.heading);
  let throttle = 1;

  // avoidance: cars ahead in a narrow cone
  for (const o of race.cars) {
    if (o === car) continue;
    const rx = o.pos.x - car.pos.x;
    const rz = o.pos.z - car.pos.z;
    const d = Math.hypot(rx, rz);
    if (d > 9 || d < 0.01) continue;
    const ahead = rx * fx + rz * fz;
    if (ahead > 0.4 * d) {
      // cross(forward, rel).y > 0 means the other car is to the left
      const side = fz * rx - fx * rz;
      steer += Math.sign(side) * 0.55 * (1 - d / 9);
      if (d < 5) throttle = Math.min(throttle, 0.35 + d * 0.1);
    }
  }

  // avoidance: cones & tire stacks ahead
  let threat = 0;
  for (const ob of race.obstacles) {
    const rx = ob.pos.x - car.pos.x;
    const rz = ob.pos.z - car.pos.z;
    const d = Math.hypot(rx, rz);
    if (d > 16 || d < 0.01) continue;
    const ahead = rx * fx + rz * fz;
    if (ahead < 1.5 || ahead > 15) continue;
    const lat = fz * rx - fx * rz; // >0 obstacle is to the left
    if (Math.abs(lat) > ob.radius + 2.6) continue;
    const prox = 1 - d / 16;
    if (Math.abs(lat) < ob.radius + 1.5) {
      const dir = Math.sign(lat) || (ob.id % 2 === 0 ? 1 : -1);
      steer += dir * (0.7 + 0.5 * prox);
    }
    if (ahead < 12 && Math.abs(lat) < ob.radius + 1.1) {
      threat = Math.max(threat, 1 - ahead / 14);
    }
  }

  // target cornering speed from curvature ahead
  const k = maxCurvatureBetween(s + 4, s + look + 20);
  let vTarget = Math.sqrt(ai.latAccel / Math.max(k, 0.0025));
  if (threat > 0) {
    // slow down when an obstacle is sitting in the line
    vTarget = Math.min(vTarget * (1 - 0.6 * threat), threat > 0.35 ? 14 : vTarget);
  }
  const speed = car.speed;

  car.input.steer = clamp(steer, -1, 1);
  if (speed > vTarget * 1.12) {
    car.input.brake = 1;
    car.input.throttle = 0;
  } else if (speed > vTarget) {
    car.input.brake = 0.4;
    car.input.throttle = 0;
  } else {
    car.input.brake = 0;
    car.input.throttle = throttle;
  }
}
