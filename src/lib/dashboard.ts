import { TARGET_LOCATION } from "@/lib/config/location";
import { computeConfidence } from "@/lib/forecast/confidence";
import { attachObservationHistory, fuseForecasts } from "@/lib/forecast/fusion";
import { computeLiveWindMargin, type LiveWindMargin } from "@/lib/fusion/live-margin";
import type { FusedContributor, FusedRealtimeWind } from "@/lib/fusion/types";
import { fetchMarineForecast, type MarinePoint } from "@/lib/marine/open-meteo-marine";
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
import { recommendWingSize } from "@/lib/watersport/wingfoil";
import { fetchFusedRealtimeWind } from "@/lib/fusion/service";
import { assessSafety, type GoStatus, type SafetyAssessment } from "@/lib/watersport/safety";
import { buildSurfAssessment, type SurfAssessment } from "@/lib/watersport/surf";
import type { SourceCheckResult } from "@/lib/sources";

export interface DashboardData {
  syncedAt: string;
  observationTimestamp: string | null;
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
    combinedSources: boolean;
    sourceLabel: string | null;
    contributors: FusedContributor[];
    fusionConfidence: number | null;
    fusionConfidenceLabel: string | null;
    fusionWarnings: string[];
    margin: LiveWindMargin;
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
  wing: ReturnType<typeof recommendWingSize>;
  safety: SafetyAssessment;
  surf: SurfAssessment;
  stations: StationReading[];
  fusion: FusedRealtimeWind | null;
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
  marinePoints: MarinePoint[],
  realtimeFusion: FusedRealtimeWind | null,
  options: { syncedAt?: string; bronnen?: SourceCheckResult[]; preview?: boolean } = {}
): DashboardData {
  const syncedAt = options.syncedAt ?? new Date().toISOString();
  const hasLive = realtimeFusion != null && realtimeFusion.includedCount > 0;

  let speedMs = realtimeFusion?.speedMs ?? 0;
  let gustMs = realtimeFusion?.gustMs ?? speedMs * 1.25;
  let directionDeg = realtimeFusion?.directionDeg ?? 270;
  const ageMinutes = realtimeFusion?.ageMinutes ?? null;
  const observationTimestamp = realtimeFusion?.observationTimestamp ?? null;

  const historyData = realtimeFusion?.history ?? stations.fused?.history ?? stations.primary?.history ?? [];
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
  const forecastFusion = fuseForecasts({
    models,
    observedSpeedMs: hasLive ? speedMs : undefined,
    observedDirectionDeg: hasLive ? directionDeg : undefined,
    observedGustMs: hasLive ? gustMs : undefined,
  });

  const nowFused = forecastFusion.timeline[0];
  if (!hasLive && nowFused && speedMs < 0.5) {
    speedMs = nowFused.speedMs;
    gustMs = nowFused.gustMs;
    directionDeg = nowFused.directionDeg;
  }

  const liveConfidenceFactors =
    (realtimeFusion?.debug?.confidenceFactors as Array<{ label: string; impact: number }>) ?? [];

  const forecastConfidence = computeConfidence({
    baseConfidence: nowFused?.confidence ?? 60,
    dataAgeMinutes: ageMinutes,
    modelDisagreementMs: forecastFusion.disagreementScore,
    trend,
    hasLiveData: hasLive,
    usedFallbackStation: stations.usedFallback,
    combinedRwsSources: (realtimeFusion?.includedCount ?? 0) > 1,
  });

  const confidenceScore =
    hasLive && realtimeFusion?.confidence != null
      ? Math.round(realtimeFusion.confidence * 0.75 + forecastConfidence.score * 0.25)
      : forecastConfidence.score;

  const confidenceFactors =
    liveConfidenceFactors.length > 0 ? liveConfidenceFactors : forecastConfidence.factors;

  const safety = assessSafety({
    windSpeedMs: speedMs,
    gustMs,
    directionDeg,
    trend,
    confidence: confidenceScore,
    riderWeight,
  });

  const kite = recommendKiteSize(speedMs, riderWeight);
  const wing = recommendWingSize(speedMs, riderWeight);
  const liveMargin = computeLiveWindMargin(realtimeFusion, speedMs);
  const surf = buildSurfAssessment(
    marinePoints,
    forecastFusion.points.map((p) => ({
      time: p.time,
      speedMs: p.speedMs,
      directionDeg: p.directionDeg,
    })),
    { speedMs, directionDeg }
  );

  const allWarnings = [...safety.warnings, ...(realtimeFusion?.warnings ?? [])];

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
      freshness: realtimeFusion?.freshness ?? freshnessLevel(ageMinutes),
      station: stations.primary,
      usedFallback: stations.usedFallback,
      combinedSources: (realtimeFusion?.includedCount ?? 0) > 1,
      sourceLabel: realtimeFusion?.primarySource ?? null,
      contributors: realtimeFusion?.contributors.filter((c) => c.included) ?? [],
      fusionConfidence: realtimeFusion?.confidence ?? null,
      fusionConfidenceLabel: realtimeFusion?.confidenceLabel ?? null,
      fusionWarnings: realtimeFusion?.warnings ?? [],
      margin: liveMargin,
    },
    decision: {
      status: safety.status,
      confidence: confidenceScore,
      confidenceFactors,
      explanation: safety.explanation,
      warnings: allWarnings,
    },
    forecast: {
      timeline: forecastFusion.timeline,
      points: forecastFusion.points.slice(0, 48),
      models: forecastFusion.modelForecasts,
      disagreementScore: forecastFusion.disagreementScore,
    },
    kite,
    wing,
    safety,
    surf,
    stations: stations.all,
    fusion: realtimeFusion,
    raw: {
      syncedAt,
      stationCount: stations.all.length,
      modelCount: models.length,
      fusionPointCount: forecastFusion.points.length,
      preview: options.preview ?? false,
      sensorCount: realtimeFusion?.sensorCount ?? 0,
      includedCount: realtimeFusion?.includedCount ?? 0,
      fusionConfidence: realtimeFusion?.confidence ?? null,
      combinedSources: (realtimeFusion?.includedCount ?? 0) > 1,
    },
  };
}

const EMPTY_STATIONS: StationSelection = {
  fused: null,
  primary: null,
  fallbacks: [],
  all: [],
  usedFallback: false,
  combinedSources: false,
};

export async function getForecastPreviewData(
  riderWeight: RiderWeight = "medium"
): Promise<DashboardData> {
  const lat = TARGET_LOCATION.latitude;
  const lon = TARGET_LOCATION.longitude;
  const [models, marinePoints] = await Promise.all([
    fetchAllModels(lat, lon, 120),
    fetchMarineForecast(72).catch(() => [] as MarinePoint[]),
  ]);
  return buildDashboardPayload(models, EMPTY_STATIONS, riderWeight, marinePoints, null, {
    preview: true,
  });
}

export async function getDashboardData(riderWeight: RiderWeight = "medium"): Promise<DashboardData> {
  const lat = TARGET_LOCATION.latitude;
  const lon = TARGET_LOCATION.longitude;
  const [stations, models, marinePoints, realtimeFusion] = await Promise.all([
    discoverAndFetchStations({ batchTimeoutMs: 12_000, perStationTimeoutMs: 6_000 }),
    fetchAllModels(lat, lon, 120),
    fetchMarineForecast(72).catch(() => [] as MarinePoint[]),
    fetchFusedRealtimeWind(),
  ]);

  return buildDashboardPayload(
    models,
    stations,
    riderWeight,
    marinePoints,
    realtimeFusion,
    { preview: false }
  );
}

export type { FusedContributor };
