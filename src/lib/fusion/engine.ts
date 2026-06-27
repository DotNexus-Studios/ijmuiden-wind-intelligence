import { observationAgeMinutes, freshnessLevel } from "@/lib/rws/client";
import { computeFusionConfidence } from "@/lib/fusion/confidence";
import {
  computeConsistencyScores,
  consistencyExclusionReason,
} from "@/lib/fusion/consistency";
import { assessSensorHealth } from "@/lib/fusion/health";
import type {
  FusedContributor,
  FusedLiveWind,
  FusedRealtimeWind,
  ProviderKind,
  ScoredObservation,
  WindObservation,
} from "@/lib/fusion/types";
import {
  distanceWeight,
  freshnessWeight,
  providerTrust,
  type ProviderTrustConfig,
} from "@/lib/fusion/weights";
import { weightedScalarMean, weightedVectorMean } from "@/lib/fusion/vectors";

const MIN_WEIGHT_TO_INCLUDE = 0.02;

function mergeHistories(observations: WindObservation[]): { value: number; timestamp: string }[] {
  const byTime = new Map<number, { sum: number; count: number; ts: string }>();
  for (const obs of observations) {
    const points = [
      ...(obs.history ?? []),
      { value: obs.speedMs, timestamp: obs.timestamp },
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

function toContributor(obs: ScoredObservation): FusedContributor {
  return {
    code: obs.stationId,
    name: obs.stationName,
    provider: obs.provider,
    providerLabel: obs.providerLabel,
    weight: obs.finalWeight,
    weightPercent: obs.weightPercent,
    speedMs: obs.speedMs,
    gustMs: obs.gustMs ?? obs.speedMs * 1.25,
    directionDeg: obs.directionDeg ?? 270,
    timestamp: obs.timestamp,
    ageMinutes: obs.ageMinutes,
    distanceKm: obs.distanceKm,
    historyPoints: obs.history?.length ?? 0,
    included: obs.included,
    exclusionReason: obs.exclusionReason,
  };
}

export interface FuseOptions {
  providerTrust?: ProviderTrustConfig;
  minWeight?: number;
}

export interface PrepareObservationInput {
  id: string;
  provider: ProviderKind;
  providerLabel: string;
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  speedMs: number;
  gustMs?: number | null;
  directionDeg?: number | null;
  timestamp: string;
  ageMinutes: number | null;
  sensorQuality?: number;
}

export function prepareObservation(input: PrepareObservationInput): WindObservation {
  return {
    id: input.id,
    provider: input.provider,
    providerLabel: input.providerLabel,
    stationId: input.stationId,
    stationName: input.stationName,
    latitude: input.latitude,
    longitude: input.longitude,
    distanceKm: input.distanceKm,
    speedMs: input.speedMs,
    gustMs: input.gustMs ?? undefined,
    directionDeg: input.directionDeg ?? undefined,
    timestamp: input.timestamp,
    ageMinutes: input.ageMinutes,
    available: true,
    metadata: input.sensorQuality != null ? { sensorQuality: input.sensorQuality } : undefined,
  };
}

export function fuseWindObservations(
  observations: WindObservation[],
  options: FuseOptions = {}
): FusedLiveWind | null {
  if (observations.length === 0) return null;

  const trustConfig = options.providerTrust;
  const minWeight = options.minWeight ?? MIN_WEIGHT_TO_INCLUDE;
  const consistencyScores = computeConsistencyScores(observations);

  const scored: ScoredObservation[] = observations.map((obs) => {
    const health = assessSensorHealth(obs);
    const distW = distanceWeight(obs.distanceKm);
    const freshW = freshnessWeight(obs.ageMinutes);
    const trustW = providerTrust(obs.provider, trustConfig);
    const healthW = health.score;
    const consistW = consistencyScores.get(obs.id) ?? 1;

    const rawWeight = distW * freshW * trustW * healthW * consistW;
    let included = health.valid && rawWeight >= minWeight && consistW >= 0.25;
    let exclusionReason: string | undefined;

    if (!health.valid) {
      included = false;
      exclusionReason = health.reason;
    } else if (consistW < 0.25) {
      included = false;
      exclusionReason = consistencyExclusionReason(obs, consistW, observations);
    } else if (rawWeight < minWeight) {
      included = false;
      exclusionReason = "Gewicht te laag voor fusie";
    }

    return {
      ...obs,
      distanceWeight: distW,
      freshnessWeight: freshW,
      providerTrust: trustW,
      sensorHealth: healthW,
      consistencyScore: consistW,
      rawWeight,
      finalWeight: included ? rawWeight : 0,
      weightPercent: 0,
      included,
      exclusionReason,
    };
  });

  const included = scored.filter((o) => o.included && o.finalWeight > 0);
  if (included.length === 0) return null;

  const totalWeight = included.reduce((s, o) => s + o.finalWeight, 0) || 1;
  for (const o of scored) {
    o.weightPercent = o.included ? Math.round((o.finalWeight / totalWeight) * 100) : 0;
    if (o.included) o.finalWeight = o.finalWeight;
  }

  const weights = included.map((o) => o.finalWeight);
  const speeds = included.map((o) => o.speedMs);
  const gusts = included.map((o) => o.gustMs ?? o.speedMs * 1.25);
  const directions = included.map((o) => o.directionDeg ?? 270);

  const vectorResult = weightedVectorMean(speeds, directions, weights);
  const gustMs = weightedScalarMean(gusts, weights);

  const newest = included.reduce((best, o) => {
    const t = new Date(o.timestamp).getTime();
    const bt = new Date(best.timestamp).getTime();
    return t > bt ? o : best;
  });

  const observationTimestamp = newest.timestamp;
  const ageMinutes =
    observationAgeMinutes({ value: vectorResult.speedMs, timestamp: observationTimestamp }) ?? 0;

  const confidence = computeFusionConfidence({
    included,
    allScored: scored,
    hasPrimaryRws: included.some((o) => o.provider === "rws"),
    hasPrimaryKnmi: included.some(
      (o) => o.provider === "knmi-edr" || o.provider === "knmi-open-data"
    ),
  });

  const warnings: string[] = [];
  if (!included.some((o) => o.provider === "rws")) {
    warnings.push("Geen RWS-stations in fusie");
  }
  const outliers = scored.filter((o) => !o.included && o.available);
  if (outliers.length > 0) {
    warnings.push(`${outliers.length} bron(nen) uitgesloten na consistentiecheck`);
  }
  if (confidence.score < 60) {
    warnings.push(`Lage betrouwbaarheid: ${confidence.label}`);
  }

  const contributors = scored.map(toContributor);
  const activeContributors = contributors.filter((c) => c.included);

  const sourceLabel =
    activeContributors.length > 1
      ? activeContributors.map((c) => `${c.name} (${c.weightPercent}%)`).join(" + ")
      : activeContributors[0]?.name ?? "Onbekend";

  return {
    speedMs: vectorResult.speedMs,
    gustMs,
    directionDeg: vectorResult.directionDeg,
    observationTimestamp,
    ageMinutes,
    sourceCount: activeContributors.length,
    combinedSources: activeContributors.length > 1,
    sourceLabel,
    contributors,
    history: mergeHistories(included),
    confidence: confidence.score,
    confidenceLabel: confidence.label,
    warnings,
    sensorCount: observations.filter((o) => o.available).length,
    sources: scored,
    debug: {
      totalObservations: observations.length,
      includedCount: included.length,
      totalWeight,
      confidenceFactors: confidence.factors,
    },
  };
}

export function fuseObservations(
  observations: WindObservation[],
  syncedAt: string
): FusedRealtimeWind {
  const fused = fuseWindObservations(observations);

  if (!fused) {
    return {
      syncedAt,
      speedMs: 0,
      gustMs: 0,
      directionDeg: 270,
      observationTimestamp: syncedAt,
      ageMinutes: 999,
      sourceCount: 0,
      combinedSources: false,
      sourceLabel: "",
      contributors: [],
      history: [],
      confidence: 0,
      confidenceLabel: "Onbetrouwbaar",
      warnings: ["Geen bruikbare windobservaties"],
      sensorCount: observations.length,
      sources: [],
      includedCount: 0,
      primarySource: null,
      freshness: "red",
      observations: [],
      sourceWeights: [],
      debug: { totalObservations: observations.length, includedCount: 0 },
    };
  }

  const included = fused.sources.filter((s) => s.included);

  return {
    ...fused,
    syncedAt,
    includedCount: included.length,
    primarySource: fused.sourceLabel,
    freshness: freshnessLevel(fused.ageMinutes),
    observations: fused.sources,
    sourceWeights: fused.sources.map((s) => ({
      provider: s.provider,
      providerLabel: s.providerLabel,
      stationId: s.stationId,
      stationName: s.stationName,
      weightPercent: s.weightPercent,
      included: s.included,
    })),
  };
}
