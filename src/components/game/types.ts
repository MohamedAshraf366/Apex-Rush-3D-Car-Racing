import type * as THREE from "three";

export type Difficulty = "easy" | "medium" | "hard";
export type RacePhase = "countdown" | "racing" | "finished";

export type ObstacleKind = "cone" | "tire";

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  pos: THREE.Vector3;
  /** collision radius (m) */
  radius: number;
}

export interface BoostPickup {
  id: number;
  pos: THREE.Vector3;
  /** collection radius (m) */
  radius: number;
  collected: boolean;
}

export interface CarSkin {
  name: string;
  color: string;
  accent: string;
}

export interface SuperheroSkin extends CarSkin {
  id: string;
  emoji: string;
}

export interface Controls {
  /** 0..1 */
  throttle: number;
  /** 0..1 */
  brake: number;
  /** -1 (left) .. +1 (right) */
  steer: number;
}

export interface AIParams {
  /** fraction of player top speed */
  speedMul: number;
  /** lateral grip used to compute cornering speed */
  latAccel: number;
  /** look-ahead distance: base + speed * lookSpeed (meters) */
  lookBase: number;
  lookSpeed: number;
  /** steering wobble amplitude (mistakes) */
  wobble: number;
  /** steering gain toward target point */
  gain: number;
}

export interface CarAI extends AIParams {
  /** preferred lateral offset from the centerline (m) */
  offsetLat: number;
  seed: number;
}

export interface CarState {
  id: number;
  name: string;
  color: string;
  accent: string;
  isPlayer: boolean;
  ai: CarAI | null;

  pos: THREE.Vector3;
  heading: number;
  speed: number;
  /** smoothed visual steering */
  steer: number;
  input: Controls;

  sampleIndex: number;
  /** distance along track / total length (0..1) */
  frac: number;
  /** signed lateral offset from centerline (left positive, meters) */
  lateral: number;
  offTrack: boolean;

  lap: number;
  lapTimes: number[];
  lapStart: number;
  bestLap: number | null;
  finished: boolean;
  finishTime: number | null;
  rank: number;

  /** seconds of boost remaining (0 = none) */
  boostTime: number;

  wrongWayTime: number;
  stuckTime: number;
}

export interface Standing {
  id: number;
  name: string;
  color: string;
  isPlayer: boolean;
  rank: number;
  finished: boolean;
  finishTime: number | null;
  bestLap: number | null;
  lapsDone: number;
}

export interface RaceState {
  id: number;
  difficulty: Difficulty;
  phase: RacePhase;
  paused: boolean;
  /** race clock, seconds since GO (only advances while racing) */
  time: number;
  cameraMode: 0 | 1;
  cameraSnap: boolean;
  controls: Controls;
  cars: CarState[];
  playerIndex: number;
  standings: Standing[];
  finishedAt: number | null;
  obstacles: Obstacle[];
  boosts: BoostPickup[];
}
