import { IJMUIDEN } from "@/lib/constants";
import { computeConfidence } from "@/lib/forecast/confidence";
import { attachObservationHistory, fuseForecasts } from "@/lib/forecast/fusion";
import { freshnessLevel } from "@/lib/rws/client";
import {
  discoverAndFetchStations,
  type StationReading,
  type StationSelection,
} from "@/lib/rws/stations";
import { computeTrend, formatWindSpeed, type WindTrend } from "@/lib/units/wind";
import { fetchAllModels } from "@/lib/weather-models/open-meteo-base";
import type { FusedForecastPoint, ModelForecast } from "@/lib/weather-models/types";
import { recommendKiteSize, type RiderWeight } from "@/lib/watersport/kite-size";
import { assessSafety, type GoStatus, type SafetyAssessment } from "@/lib/watersport/safety";
import type { SourceCheckResult } from "@/lib/sources";

export interface DashboardData {
  syncedAt: string;
  /** Tijdstip van de RWS-meting zelf */
  observationTimestamp: string | null;
  /** true wanneer alleen voorspelling geladen is, RWS volgt nog */
  preview?: boolean;
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

function pickForecastNow(models: ModelForecast[]) {
  const allPoints = models.flatMap((m) => m.points);
  return allPoints.reduce<(typeof allPoints)[0] | null>((best, p) => {
    const diff = Math.abs(new Date(p.time).getTime() - Date.now());
    if (diff >= 3_600_000) return best;
    if (!best) return p;
    const bestDiff = Math.abs(new Date(best.time).getTime() - Date.now());
    return diff < bestDiff ? p : best;
  }, null);
}

function buildDashboardPayload(
  models: ModelForecast[],
  stations: StationSelection,
  riderWeight: RiderWeight,
  options: { syncedAt?: string; bronnen?: SourceCheckResult[]; preview?: boolean } = {}
): DashboardData {
  const syncedAt = options.syncedAt ?? new Date().toISOString();
  const primary = stations.primary;
  const hasLive = primary != null;

  let speedMs = primary?.latest.speed?.value ?? 0;
  let gustMs = primary?.latest.gust?.value ?? speedMs * 1.25;
  let directionDeg = primary?.latest.direction?.value ?? 270;
  const ageMinutes = primary?.ageMinutes ?? null;
  const observationTimestamp = primary?.latest.speed?.timestamp ?? null;

  const historyData = primary?.history ?? [];
  attachObservationHistory(models, historyData);

  if (!hasLive && models.length > 0) {
    const now = pickForecastNow(models);
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
    observationTimestamp,
    preview: options.preview,
    bronnen: options.bronnen ?? [],
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
      preview: options.preview ?? false,
    },
  };
}

const EMPTY_STATIONS: StationSelection = {
  primary: null,
  fallbacks: [],
  all: [],
  usedFallback: false,
};

/** Snelle voorspelling zonder RWS (voor progressive loading) */
export async function getForecastPreviewData(
  riderWeight: RiderWeight = "medium"
): Promise<DashboardData> {
  const models = await fetchAllModels(IJMUIDEN.lat, IJMUIDEN.lon, 120);
  return buildDashboardPayload(models, EMPTY_STATIONS, riderWeight, { preview: true });
}

export async function getDashboardData(riderWeight: RiderWeight = "medium"): Promise<DashboardData> {
  const [stations, models] = await Promise.all([
    discoverAndFetchStations({ batchTimeoutMs: 12_000, perStationTimeoutMs: 6_000 }),
    fetchAllModels(IJMUIDEN.lat, IJMUIDEN.lon, 120),
  ]);

  return buildDashboardPayload(models, stations, riderWeight, { preview: false });
}
