import { observationAgeMinutes } from "@/lib/rws/client";
import type { FusedContributor, FusedLiveWind } from "@/lib/fusion/types";
import type { StationReading } from "@/lib/rws/stations";

/** Recency: nieuwere meting krijgt exponentieel meer gewicht (half-life ~12 min) */
function recencyWeight(ageMinutes: number | null): number {
  const age = ageMinutes ?? 120;
  return Math.exp(-age / 12);
}

function completenessWeight(reading: StationReading): number {
  let factor = 1;
  if (reading.latest.direction?.value != null) factor += 0.15;
  if (reading.latest.gust?.value != null) factor += 0.15;
  const historyPoints = reading.history.length + (reading.latest.speed ? 1 : 0);
  factor += Math.min(historyPoints / 36, 0.25);
  return factor;
}

function stationWeight(reading: StationReading): number {
  if (!reading.available || reading.latest.speed?.value == null) return 0;
  return recencyWeight(reading.ageMinutes) * completenessWeight(reading);
}

function weightedCircularMean(degrees: number[], weights: number[]): number {
  let sinSum = 0;
  let cosSum = 0;
  let wSum = 0;
  for (let i = 0; i < degrees.length; i++) {
    const w = weights[i];
    if (w <= 0) continue;
    const rad = (degrees[i] * Math.PI) / 180;
    sinSum += w * Math.sin(rad);
    cosSum += w * Math.cos(rad);
    wSum += w;
  }
  if (wSum <= 0) return degrees[0] ?? 270;
  return ((Math.atan2(sinSum / wSum, cosSum / wSum) * 180) / Math.PI + 360) % 360;
}

function mergeHistories(readings: StationReading[]): { value: number; timestamp: string }[] {
  const byTime = new Map<number, { sum: number; count: number; ts: string }>();
  for (const reading of readings) {
    const points = [
      ...reading.history,
      ...(reading.latest.speed
        ? [{ value: reading.latest.speed.value, timestamp: reading.latest.speed.timestamp }]
        : []),
    ];
    for (const p of points) {
      const t = new Date(p.timestamp).getTime();
      if (Number.isNaN(t)) continue;
      const bucket = Math.floor(t / 60_000) * 60_000;
      const cur = byTime.get(bucket);
      if (cur) {
        cur.sum += p.value;
        cur.count += 1;
      } else {
        byTime.set(bucket, { sum: p.value, count: 1, ts: p.timestamp });
      }
    }
  }
  return [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({ value: v.sum / v.count, timestamp: v.ts }));
}

/** Legacy RWS-only fusion (fallback) */
export function fuseStationReadings(readings: StationReading[]): FusedLiveWind | null {
  const candidates = readings.filter((r) => r.available && r.latest.speed?.value != null);
  if (candidates.length === 0) return null;

  const contributors: FusedContributor[] = candidates.map((reading) => {
    const speedMs = reading.latest.speed!.value;
    const gustMs = reading.latest.gust?.value ?? speedMs * 1.25;
    const directionDeg = reading.latest.direction?.value ?? 270;
    const timestamp = reading.latest.speed!.timestamp;
    const weight = stationWeight(reading);
    return {
      code: reading.station.code,
      name: reading.station.name,
      provider: "rws" as const,
      providerLabel: "RWS",
      weight,
      weightPercent: 0,
      speedMs,
      gustMs,
      directionDeg,
      timestamp,
      ageMinutes: reading.ageMinutes,
      distanceKm: reading.distanceKm,
      historyPoints: reading.history.length,
      included: true,
    };
  });

  const totalWeight = contributors.reduce((s, c) => s + c.weight, 0) || 1;
  for (const c of contributors) {
    c.weightPercent = Math.round((c.weight / totalWeight) * 100);
  }

  const weights = contributors.map((c) => c.weight);
  const speedMs = contributors.reduce((s, c) => s + c.speedMs * c.weight, 0) / totalWeight;
  const gustMs = contributors.reduce((s, c) => s + c.gustMs * c.weight, 0) / totalWeight;
  const directionDeg = weightedCircularMean(
    contributors.map((c) => c.directionDeg),
    weights
  );

  const newest = contributors.reduce((best, c) => {
    const t = new Date(c.timestamp).getTime();
    const bt = new Date(best.timestamp).getTime();
    return t > bt ? c : best;
  });

  const observationTimestamp = newest.timestamp;
  const ageMinutes =
    observationAgeMinutes({ value: speedMs, timestamp: observationTimestamp }) ?? 0;

  const sourceLabel =
    contributors.length > 1
      ? contributors.map((c) => `${c.name} (${c.weightPercent}%)`).join(" + ")
      : contributors[0].name;

  return {
    speedMs,
    gustMs,
    directionDeg,
    observationTimestamp,
    ageMinutes,
    sourceCount: contributors.length,
    combinedSources: contributors.length > 1,
    sourceLabel,
    contributors,
    history: mergeHistories(candidates),
    confidence: 70,
    confidenceLabel: "Goed",
    warnings: [],
    sensorCount: contributors.length,
    sources: [],
  };
}

export type { FusedContributor, FusedLiveWind } from "@/lib/fusion/types";
