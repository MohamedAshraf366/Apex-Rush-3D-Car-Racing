"use client";

import { useEffect, type RefObject } from "react";
import type { RaceState } from "./types";

const HANDLED = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "Space",
]);

export function useKeyboard({
  raceRef,
  onPause,
  onReset,
  onCamera,
}: {
  raceRef: RefObject<RaceState | null>;
  onPause: () => void;
  onReset: () => void;
  onCamera: () => void;
}) {
  useEffect(() => {
    const down = new Set<string>();

    const apply = () => {
      const c = raceRef.current?.controls;
      if (!c) return;
      const left = down.has("ArrowLeft") || down.has("KeyA");
      const right = down.has("ArrowRight") || down.has("KeyD");
      c.steer = (right ? 1 : 0) - (left ? 1 : 0);
      c.throttle = down.has("ArrowUp") || down.has("KeyW") ? 1 : 0;
      c.brake =
        down.has("ArrowDown") || down.has("KeyS") || down.has("Space") ? 1 : 0;
    };

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (HANDLED.has(e.code)) e.preventDefault();
        return;
      }
      switch (e.code) {
        case "KeyP":
        case "Escape":
          onPause();
          break;
        case "KeyR":
          onReset();
          break;
        case "KeyC":
          onCamera();
          break;
      }
      if (HANDLED.has(e.code)) {
        down.add(e.code);
        apply();
        e.preventDefault();
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (down.delete(e.code)) apply();
    };

    const onBlur = () => {
      down.clear();
      apply();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [raceRef, onPause, onReset, onCamera]);
}
