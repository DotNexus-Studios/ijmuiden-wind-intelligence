import { IJMUIDEN } from "@/lib/constants";
import { computeConfidence } from "@/lib/forecast/confidence";
import { attachObservationHistory, fuseForecasts } from "@/lib/forecast/fusion";
import { freshnessLevel } from "@/lib/rws/client";
import { discoverAndFetchStations, type StationReading } from "@/lib/rws/stations";
import { computeTrend, formatWindSpeed, type WindTrend } from "@/lib/units/wind";
import { fetchAllModels } from "@/lib/weather-models/open-meteo-base";
import type { FusedForecastPoint, ModelForecast } from "@/lib/weather-models/types";
import { recommendKiteSize, type RiderWeight } from "@/lib/watersport/kite-size";
import { assessSafety, type GoStatus, type SafetyAssessment } from "@/lib/watersport/safety";
import { checkAllSources, type SourceCheckResult } from "@/lib/sources";

export interface DashboardData {
  syncedAt: string;
  error?: string;
  bronnen: SourceCheckResult[];
  live: {
    speedMs: number;
    gustMs: number;
    directionDeg: number;
    trend: WindTrend;
    formatted: ReturnType<typeof formatWindSpeed>;
    ageMinutes: number | null;
    freshness: "green" | "orange" | "red";
    station: StationReading | null;
    usedFallback: boolean;
  };
  decision: {
    status: GoStatus;
    confidence: number;
    confidenceFactors: Array<{ label: string; impact: number }>;
    explanation: string;
    warnings: string[];
  };
  forecast: {
    timeline: FusedForecastPoint[];
    points: FusedForecastPoint[];
    models: ModelForecast[];
    disagreementScore: number;
  };
  kite: ReturnType<typeof recommendKiteSize>;
  safety: SafetyAssessment;
  stations: StationReading[];
  raw: Record<string, unknown>;
}

export async function getDashboardData(riderWeight: RiderWeight = "medium"): Promise<DashboardData> {
  const syncedAt = new Date().toISOString();

  const [stations, models, bronnen] = await Promise.all([
    discoverAndFetchStations(),
    fetchAllModels(IJMUIDEN.lat, IJMUIDEN.lon, 120),
    checkAllSources(),
  ]);

  const primary = stations.primary;
  const hasLive = primary != null;

  let speedMs = primary?.latest.speed?.value ?? 0;
  let gustMs = primary?.latest.gust?.value ?? speedMs * 1.25;
  let directionDeg = primary?.latest.direction?.value ?? 270;
  const ageMinutes = primary?.ageMinutes ?? null;

  const historyData = primary?.history ?? [];
  attachObservationHistory(models, historyData);

  if (!hasLive && models.length > 0) {
    const allPoints = models.flatMap((m) => m.points);
    const now = allPoints.reduce<(typeof allPoints)[0] | null>((best, p) => {
      const diff = Math.abs(new Date(p.time).getTime() - Date.now());
      if (diff >= 3_600_000) return best;
      if (!best) return p;
      const bestDiff = Math.abs(new Date(best.time).getTime() - Date.now());
      return diff < bestDiff ? p : best;
    }, null);
    if (now) {
      speedMs = now.speedMs;
      gustMs = now.gustMs ?? speedMs * 1.25;
      directionDeg = now.directionDeg;
    }
  }

  const trend = computeTrend(historyData.map((h) => h.value));
  const fusion = fuseForecasts({
    models,
    observedSpeedMs: hasLive ? speedMs : undefined,
    observedDirectionDeg: hasLive ? directionDeg : undefined,
    observedGustMs: hasLive ? gustMs : undefined,
  });

  const nowFused = fusion.timeline[0];
  if (!hasLive && nowFused && speedMs < 0.5) {
    speedMs = nowFused.speedMs;
    gustMs = nowFused.gustMs;
    directionDeg = nowFused.directionDeg;
  }
  const baseConfidence = nowFused?.confidence ?? 60;

  const confidence = computeConfidence({
    baseConfidence,
    dataAgeMinutes: ageMinutes,
    modelDisagreementMs: fusion.disagreementScore,
    trend,
    hasLiveData: hasLive,
    usedFallbackStation: stations.usedFallback,
  });

  const safety = assessSafety({
    windSpeedMs: speedMs,
    gustMs,
    directionDeg,
    trend,
    confidence: confidence.score,
    riderWeight,
  });

  const kite = recommendKiteSize(speedMs, riderWeight);

  return {
    syncedAt,
    bronnen,
    live: {
      speedMs,
      gustMs,
      directionDeg,
      trend,
      formatted: formatWindSpeed(speedMs),
      ageMinutes,
      freshness: freshnessLevel(ageMinutes),
      station: primary,
      usedFallback: stations.usedFallback,
    },
    decision: {
      status: safety.status,
      confidence: confidence.score,
      confidenceFactors: confidence.factors,
      explanation: safety.explanation,
      warnings: safety.warnings,
    },
    forecast: {
      timeline: fusion.timeline,
      points: fusion.points.slice(0, 48),
      models: fusion.modelForecasts,
      disagreementScore: fusion.disagreementScore,
    },
    kite,
    safety,
    stations: stations.all,
    raw: {
      syncedAt,
      stationCount: stations.all.length,
      modelCount: models.length,
      fusionPointCount: fusion.points.length,
    },
  };
}
