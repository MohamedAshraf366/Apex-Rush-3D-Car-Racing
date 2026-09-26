"use client";

import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { RaceState } from "./types";

function TouchBtn({
  label,
  ariaLabel,
  onPointerDown,
  onPointerUp,
}: {
  label: string;
  ariaLabel: string;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerUp: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
      className="flex h-16 w-16 touch-none select-none items-center justify-center rounded-full bg-black/40 text-2xl font-black leading-none text-white ring-1 ring-white/25 backdrop-blur-sm active:bg-white/25"
    >
      {label}
    </button>
  );
}

export function TouchControls({ raceRef }: { raceRef: RefObject<RaceState | null> }) {
  const held = useRef({ l: false, r: false });

  const updateSteer = useCallback(() => {
    const race = raceRef.current;
    if (race) race.controls.steer = (held.current.r ? 1 : 0) - (held.current.l ? 1 : 0);
  }, [raceRef]);

  const setHeld = useCallback(
    (side: "l" | "r", on: boolean) => {
      held.current[side] = on;
      updateSteer();
    },
    [updateSteer]
  );

  const capturePointer = useCallback((e: ReactPointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const setBrake = useCallback(
    (on: boolean) => {
      const race = raceRef.current;
      if (race) race.controls.brake = on ? 1 : 0;
    },
    [raceRef]
  );

  const setThrottle = useCallback(
    (on: boolean) => {
      const race = raceRef.current;
      if (race) race.controls.throttle = on ? 1 : 0;
    },
    [raceRef]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 md:hidden">
      <div className="pointer-events-auto absolute bottom-5 left-4 flex gap-3">
        <TouchBtn
          label="◀"
          ariaLabel="Steer left"
          onPointerDown={(e) => {
            capturePointer(e);
            setHeld("l", true);
          }}
          onPointerUp={() => setHeld("l", false)}
        />
        <TouchBtn
          label="▶"
          ariaLabel="Steer right"
          onPointerDown={(e) => {
            capturePointer(e);
            setHeld("r", true);
          }}
          onPointerUp={() => setHeld("r", false)}
        />
      </div>
      <div className="pointer-events-auto absolute bottom-5 right-4 flex items-end gap-3">
        <TouchBtn
          label="▼"
          ariaLabel="Brake and reverse"
          onPointerDown={(e) => {
            capturePointer(e);
            setBrake(true);
          }}
          onPointerUp={() => setBrake(false)}
        />
        <TouchBtn
          label="▲"
          ariaLabel="Accelerate"
          onPointerDown={(e) => {
            capturePointer(e);
            setThrottle(true);
          }}
          onPointerUp={() => setThrottle(false)}
        />
      </div>
    </div>
  );
}
