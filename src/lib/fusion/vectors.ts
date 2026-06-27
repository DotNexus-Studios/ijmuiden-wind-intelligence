/** U/V vector gemiddelde voor windrichting (voorkomt 359° + 1° = 180°) */

export interface WindVector {
  u: number;
  v: number;
}

export function directionToVector(speedMs: number, directionFromDeg: number): WindVector {
  const rad = (directionFromDeg * Math.PI) / 180;
  return {
    u: -speedMs * Math.sin(rad),
    v: -speedMs * Math.cos(rad),
  };
}

export function vectorToDirection(u: number, v: number): number {
  if (Math.abs(u) < 1e-9 && Math.abs(v) < 1e-9) return 270;
  const deg = (Math.atan2(-u, -v) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function weightedVectorMean(
  speeds: number[],
  directions: number[],
  weights: number[]
): { speedMs: number; directionDeg: number } {
  let uSum = 0;
  let vSum = 0;
  let wSum = 0;
  let speedSum = 0;

  for (let i = 0; i < speeds.length; i++) {
    const w = weights[i];
    if (w <= 0) continue;
    const vec = directionToVector(speeds[i], directions[i]);
    uSum += vec.u * w;
    vSum += vec.v * w;
    speedSum += speeds[i] * w;
    wSum += w;
  }

  if (wSum <= 0) {
    return { speedMs: speeds[0] ?? 0, directionDeg: directions[0] ?? 270 };
  }

  const u = uSum / wSum;
  const v = vSum / wSum;
  const vectorSpeed = Math.sqrt(u * u + v * v);
  const scalarSpeed = speedSum / wSum;

  return {
    speedMs: vectorSpeed > 0.01 ? vectorSpeed : scalarSpeed,
    directionDeg: vectorToDirection(u, v),
  };
}

export function weightedScalarMean(values: number[], weights: number[]): number {
  let sum = 0;
  let wSum = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i];
    if (w <= 0) continue;
    sum += values[i] * w;
    wSum += w;
  }
  return wSum > 0 ? sum / wSum : values[0] ?? 0;
}
