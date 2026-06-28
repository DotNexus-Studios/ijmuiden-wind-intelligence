"use client";

import { useEffect, useRef, useState } from "react";

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestDelta(from: number, to: number): number {
  const a = normalizeDeg(from);
  const b = normalizeDeg(to);
  let delta = b - a;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

export function useAnimatedDegrees(target: number, durationMs = 900): number {
  const [value, setValue] = useState(() => normalizeDeg(target));
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(normalizeDeg(target));

  useEffect(() => {
    const goal = normalizeDeg(target);
    const from = fromRef.current;
    const delta = shortestDelta(from, goal);

    if (Math.abs(delta) < 0.05) {
      fromRef.current = goal;
      setValue(goal);
      return;
    }

    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      const next = normalizeDeg(from + delta * eased);
      setValue(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = goal;
        setValue(goal);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs]);

  return value;
}
