export type WindTrend = "rising" | "stable" | "dropping";

const MS_TO_KNOTS = 1.94384;

export function msToKnots(ms: number): number {
  return ms * MS_TO_KNOTS;
}

export function knotsToMs(knots: number): number {
  return knots / MS_TO_KNOTS;
}

export function msToBeaufort(ms: number): number {
  if (ms < 0.3) return 0;
  if (ms < 1.6) return 1;
  if (ms < 3.4) return 2;
  if (ms < 5.5) return 3;
  if (ms < 8.0) return 4;
  if (ms < 10.8) return 5;
  if (ms < 13.9) return 6;
  if (ms < 17.2) return 7;
  if (ms < 20.8) return 8;
  if (ms < 24.5) return 9;
  if (ms < 28.5) return 10;
  if (ms < 32.7) return 11;
  return 12;
}

export function beaufortLabel(bft: number): string {
  const labels = [
    "Stil",
    "Luchtje",
    "Lichte bries",
    "Matige bries",
    "Vrij krachtige bries",
    "Vrij krachtige wind",
    "Krachtige wind",
    "Harde wind",
    "Stormachtige wind",
    "Storm",
    "Zware storm",
    "Orkaan",
  ];
  return labels[Math.min(Math.max(Math.round(bft), 0), 12)] ?? "Onbekend";
}

export function formatWindSpeed(ms: number): {
  ms: number;
  knots: number;
  beaufort: number;
  beaufortLabel: string;
} {
  const knots = msToKnots(ms);
  const beaufort = msToBeaufort(ms);
  return {
    ms: Math.round(ms * 10) / 10,
    knots: Math.round(knots),
    beaufort,
    beaufortLabel: beaufortLabel(beaufort),
  };
}

export function directionToCompass(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16;
  return dirs[idx];
}

export function directionLabel(degrees: number): string {
  return `${Math.round(degrees)}° ${directionToCompass(degrees)}`;
}

/** Meteorologische windrichting (0-360): waar de wind vandaan komt */
export function normalizeWindFromDeg(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Waar de wind naartoe waait (tegenover van vandaan) */
export function windToDeg(fromDeg: number): number {
  return (normalizeWindFromDeg(fromDeg) + 180) % 360;
}

/** Aflandige wind voor IJmuiden kust (wind uit oostelijke sector) */
export function isOffshoreWind(fromDeg: number): boolean {
  const d = normalizeWindFromDeg(fromDeg);
  return d >= 45 && d < 135;
}

export type WindDirectionQuality = "offshore" | "onshore" | "side-onshore" | "side-shore";

export function classifyWindDirectionQuality(fromDeg: number): WindDirectionQuality {
  const d = normalizeWindFromDeg(fromDeg);
  if (d >= 45 && d < 135) return "offshore";
  if (d >= 135 && d < 225) return "onshore";
  if (d >= 225 && d < 315) return "side-onshore";
  return "side-shore";
}

/** Punt op windroos (noord boven, meteo-graden met de klok mee) */
export function compassPoint(cx: number, cy: number, radius: number, fromDeg: number) {
  const rad = (normalizeWindFromDeg(fromDeg) * Math.PI) / 180;
  return {
    x: cx + radius * Math.sin(rad),
    y: cy - radius * Math.cos(rad),
  };
}

/** Circular mean for wind direction in degrees */
export function circularMeanDirection(degrees: number[]): number {
  if (degrees.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const d of degrees) {
    const rad = (d * Math.PI) / 180;
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  const mean = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  return ((mean % 360) + 360) % 360;
}

/** Angular difference 0-180 */
export function directionSpread(degrees: number[]): number {
  if (degrees.length < 2) return 0;
  const mean = circularMeanDirection(degrees);
  let maxDiff = 0;
  for (const d of degrees) {
    let diff = Math.abs(d - mean);
    if (diff > 180) diff = 360 - diff;
    maxDiff = Math.max(maxDiff, diff);
  }
  return maxDiff;
}

export function computeTrend(recent: number[], threshold = 0.5): WindTrend {
  if (recent.length < 2) return "stable";
  const first = recent.slice(0, Math.ceil(recent.length / 2));
  const second = recent.slice(Math.ceil(recent.length / 2));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  const delta = avgSecond - avgFirst;
  if (delta > threshold) return "rising";
  if (delta < -threshold) return "dropping";
  return "stable";
}

export function gustFactor(gustMs: number, avgMs: number): number {
  if (avgMs <= 0) return 1;
  return gustMs / avgMs;
}
