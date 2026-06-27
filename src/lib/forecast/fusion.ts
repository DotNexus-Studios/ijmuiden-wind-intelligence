import { applyBiasCorrection, computeModelBiases } from "@/lib/fusion/forecast-correction";
import type { FusedForecastPoint, FusionResult, ModelForecast, WeatherModelId } from "@/lib/weather-models/types";
import {
  circularMeanDirection,
  directionSpread,
  gustFactor,
  msToKnots,
} from "@/lib/units/wind";

const COASTAL_SPEED_FACTOR = 1.08;

interface FusionInput {
  models: ModelForecast[];
  observedSpeedMs?: number;
  observedDirectionDeg?: number;
  observedGustMs?: number;
}

function hoursFromNow(timeIso: string): number {
  return (new Date(timeIso).getTime() - Date.now()) / 3_600_000;
}

function getWeights(hoursAhead: number): Record<WeatherModelId, number> {
  if (hoursAhead <= 24) {
    return { harmonie: 0.45, icon: 0.25, ecmwf: 0.2, gfs: 0.1 };
  }
  if (hoursAhead <= 48) {
    return { harmonie: 0.35, icon: 0.15, ecmwf: 0.35, gfs: 0.15 };
  }
  if (hoursAhead <= 120) {
    return { harmonie: 0.1, icon: 0.2, ecmwf: 0.5, gfs: 0.2 };
  }
  return { harmonie: 0.05, icon: 0.15, ecmwf: 0.6, gfs: 0.2 };
}


function computeModelErrors(
  models: ModelForecast[],
  history: { value: number; timestamp: string }[]
): void {
  if (history.length < 2) return;

  for (const model of models) {
    const errors: number[] = [];
    for (const obs of history.slice(-24)) {
      const obsTime = new Date(obs.timestamp).getTime();
      const point = model.points.reduce((best, p) => {
        const diff = Math.abs(new Date(p.time).getTime() - obsTime);
        const bestDiff = Math.abs(new Date(best.time).getTime() - obsTime);
        return diff < bestDiff ? p : best;
      }, model.points[0]);
      if (point) errors.push(point.speedMs - obs.value);
    }
    if (errors.length) {
      const rmse = Math.sqrt(errors.reduce((s, e) => s + e * e, 0) / errors.length);
      model.errorTracking = { h6: rmse, h12: rmse * 1.1, h24: rmse * 1.25 };
    }
  }
}

function directionAwareWeight(baseWeight: number, modelDir: number, observedDir?: number): number {
  if (observedDir == null) return baseWeight;
  let diff = Math.abs(modelDir - observedDir);
  if (diff > 180) diff = 360 - diff;
  const dirPenalty = diff > 45 ? Math.max(0.3, 1 - (diff - 45) / 90) : 1;
  return baseWeight * dirPenalty;
}

function fuseAtTime(
  models: ModelForecast[],
  timeIso: string,
  label: string,
  bias: Partial<Record<WeatherModelId, number>>,
  observed?: { speedMs?: number; directionDeg?: number; gustMs?: number }
): FusedForecastPoint {
  const hoursAhead = hoursFromNow(timeIso);
  const baseWeights = getWeights(hoursAhead);
  const contributions: Array<{
    model: WeatherModelId;
    speed: number;
    direction: number;
    gust: number;
    weight: number;
  }> = [];

  for (const model of models) {
    const point = model.points.find((p) => p.time === timeIso);
    if (!point) continue;

    let speed = applyBiasCorrection(point.speedMs, model.model, hoursAhead, bias);
    const error = model.errorTracking?.h6 ?? 0;
    const errorPenalty = error > 0 ? Math.max(0.5, 1 - error / 5) : 1;

    let w =
      (baseWeights[model.model] ?? 0.1) *
      errorPenalty *
      directionAwareWeight(1, point.directionDeg, observed?.directionDeg);

    if (hoursAhead < 3 && model.model === "harmonie") w *= 1.15;
    speed *= COASTAL_SPEED_FACTOR;

    contributions.push({
      model: model.model,
      speed,
      direction: point.directionDeg,
      gust: point.gustMs ?? point.speedMs * 1.25,
      weight: w,
    });
  }

  const totalWeight = contributions.reduce((s, c) => s + c.weight, 0) || 1;
  const speedMs = contributions.reduce((s, c) => s + c.speed * c.weight, 0) / totalWeight;
  const directions = contributions.map((c) => c.direction);
  const directionDeg = circularMeanDirection(directions);

  let gustMs = contributions.reduce((s, c) => s + c.gust * c.weight, 0) / totalWeight;
  if (observed?.gustMs && observed?.speedMs && hoursAhead < 1) {
    gustMs = Math.max(gustMs, speedMs * gustFactor(observed.gustMs, observed.speedMs));
  }

  const speeds = contributions.map((c) => c.speed);
  const modelSpread = speeds.length > 1 ? Math.max(...speeds) - Math.min(...speeds) : 0;
  const disagreement = modelSpread + directionSpread(directions) / 20;

  const weights: Partial<Record<WeatherModelId, number>> = {};
  for (const c of contributions) weights[c.model] = Math.round((c.weight / totalWeight) * 100);

  return {
    time: timeIso,
    label,
    hoursFromNow: hoursAhead,
    speedMs,
    directionDeg,
    gustMs,
    confidence: Math.max(20, Math.min(95, 85 - disagreement * 8 - (hoursAhead > 48 ? 10 : 0))),
    modelSpread,
    weights,
  };
}

export function fuseForecasts(input: FusionInput): FusionResult {
  const { models, observedSpeedMs, observedDirectionDeg, observedGustMs } = input;

  if (models.length === 0) {
    return { points: [], timeline: [], modelForecasts: [], disagreementScore: 1, coastalCorrectionApplied: false };
  }

  const bias =
    observedSpeedMs != null ? computeModelBiases(models, observedSpeedMs) : {};
  const allTimes = new Set<string>();
  for (const m of models) for (const p of m.points) allTimes.add(p.time);

  const sortedTimes = [...allTimes].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const observed = { speedMs: observedSpeedMs, directionDeg: observedDirectionDeg, gustMs: observedGustMs };

  const points = sortedTimes.map((time) => {
    const h = hoursFromNow(time);
    const label = Math.abs(h) < 0.5 ? "Nu" : `+${Math.round(h)}u`;
    return fuseAtTime(models, time, label, bias, observed);
  });

  const timelineOffsets = [0, 1, 3, 6, 12, 24, 48];
  const timeline = timelineOffsets
    .map((offset) => {
      const target = Date.now() + offset * 3_600_000;
      const closest = points.reduce((best, p) => {
        const diff = Math.abs(new Date(p.time).getTime() - target);
        const bestDiff = Math.abs(new Date(best.time).getTime() - target);
        return diff < bestDiff ? p : best;
      }, points[0]);
      if (!closest) return null;
      const labels: Record<number, string> = { 0: "Nu", 1: "+1u", 3: "+3u", 6: "+6u", 12: "+12u", 24: "+24u", 48: "+48u" };
      return { ...closest, label: labels[offset] ?? closest.label };
    })
    .filter((p): p is FusedForecastPoint => p != null);

  const nowSpeeds = models
    .map((m) => m.points.find((p) => Math.abs(hoursFromNow(p.time)) < 1)?.speedMs)
    .filter((s): s is number => s != null);

  return {
    points,
    timeline,
    modelForecasts: models,
    disagreementScore: nowSpeeds.length > 1 ? Math.max(...nowSpeeds) - Math.min(...nowSpeeds) : 0,
    coastalCorrectionApplied: true,
  };
}

export function attachObservationHistory(
  models: ModelForecast[],
  history: { value: number; timestamp: string }[]
): void {
  computeModelErrors(models, history);
}

export function formatSpeedRangeKt(speedMs: number, spread: number): string {
  const center = msToKnots(speedMs);
  const half = msToKnots(spread / 2);
  return `${Math.round(center - half)}-${Math.round(center + half)} kt`;
}
