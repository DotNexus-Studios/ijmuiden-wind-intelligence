import { knotsToMs } from "@/lib/units/wind";
import type { WindObservation } from "@/lib/fusion/types";

const MAX_WIND_MS = 50;
const MAX_GUST_FACTOR = 2.5;

export interface SensorHealthResult {
  score: number;
  valid: boolean;
  reason?: string;
}

export function assessSensorHealth(obs: WindObservation): SensorHealthResult {
  if (obs.offline || !obs.available) {
    return { score: 0, valid: false, reason: "Station offline" };
  }

  if (!obs.timestamp) {
    return { score: 0, valid: false, reason: "Ontbrekende timestamp" };
  }

  const ts = new Date(obs.timestamp).getTime();
  if (Number.isNaN(ts)) {
    return { score: 0, valid: false, reason: "Ongeldige timestamp" };
  }

  const futureMs = ts - Date.now();
  if (futureMs > 5 * 60_000) {
    return { score: 0, valid: false, reason: "Timestamp in de toekomst" };
  }

  if (obs.speedMs == null || !Number.isFinite(obs.speedMs)) {
    return { score: 0, valid: false, reason: "Ontbrekende windsnelheid" };
  }

  if (obs.speedMs < 0) {
    return { score: 0, valid: false, reason: "Negatieve windsnelheid" };
  }

  if (obs.speedMs > MAX_WIND_MS) {
    return { score: 0.1, valid: false, reason: "Onrealistische windsnelheid" };
  }

  const gust = obs.gustMs ?? obs.speedMs * 1.25;
  if (gust < obs.speedMs - 0.05) {
    return { score: 0.15, valid: false, reason: "Vlaag lager dan gemiddelde wind" };
  }

  if (gust > obs.speedMs * MAX_GUST_FACTOR) {
    return { score: 0.3, valid: false, reason: "Onrealistische windvlaag" };
  }

  if (obs.directionDeg != null && (obs.directionDeg < 0 || obs.directionDeg > 360)) {
    return { score: 0.4, valid: false, reason: "Ongeldige windrichting" };
  }

  let score = 1;
  if (obs.ageMinutes != null && obs.ageMinutes > 120) score *= 0.5;
  if (obs.directionDeg == null) score *= 0.85;
  if (obs.gustMs == null) score *= 0.9;

  return { score, valid: true };
}

/** Converteer METAR wind (knopen) naar m/s indien nodig */
export function normalizeSpeedMs(value: number, unit: "ms" | "knots" = "ms"): number {
  return unit === "knots" ? knotsToMs(value) : value;
}
