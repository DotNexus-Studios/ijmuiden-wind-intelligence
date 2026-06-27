export type ProviderKind =
  | "rws"
  | "knmi-edr"
  | "knmi-open-data"
  | "metar"
  | "wow"
  | "camera-ai"
  | "weather-underground"
  | "other";

export interface WindObservation {
  id: string;
  provider: ProviderKind;
  providerLabel: string;
  stationId: string;
  stationName: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  speedMs: number;
  gustMs?: number;
  directionDeg?: number;
  timestamp: string;
  ageMinutes: number | null;
  available: boolean;
  offline?: boolean;
  history?: { value: number; timestamp: string }[];
  metadata?: Record<string, unknown>;
}

export interface ScoredObservation extends WindObservation {
  distanceWeight: number;
  freshnessWeight: number;
  providerTrust: number;
  sensorHealth: number;
  consistencyScore: number;
  rawWeight: number;
  finalWeight: number;
  weightPercent: number;
  included: boolean;
  exclusionReason?: string;
}

export interface FusedContributor {
  code: string;
  name: string;
  provider: ProviderKind;
  providerLabel: string;
  weight: number;
  weightPercent: number;
  speedMs: number;
  gustMs: number;
  directionDeg: number;
  timestamp: string;
  ageMinutes: number | null;
  distanceKm: number;
  historyPoints: number;
  included: boolean;
  exclusionReason?: string;
}

export interface FusedLiveWind {
  speedMs: number;
  gustMs: number;
  directionDeg: number;
  observationTimestamp: string;
  ageMinutes: number;
  sourceCount: number;
  combinedSources: boolean;
  sourceLabel: string;
  contributors: FusedContributor[];
  history: { value: number; timestamp: string }[];
  confidence: number;
  confidenceLabel: string;
  warnings: string[];
  sensorCount: number;
  sources: ScoredObservation[];
  debug?: Record<string, unknown>;
}

/** API response shape for /api/realtime/fused */
export interface FusedRealtimeWind extends FusedLiveWind {
  syncedAt: string;
  includedCount: number;
  primarySource: string | null;
  freshness: "green" | "orange" | "red";
  observations: ScoredObservation[];
  sourceWeights: Array<{
    provider: ProviderKind;
    providerLabel: string;
    stationId: string;
    stationName: string;
    weightPercent: number;
    included: boolean;
  }>;
}

export type ConfidenceTier = "unreliable" | "low" | "good" | "high" | "excellent";

export interface FusionConfidenceResult {
  score: number;
  tier: ConfidenceTier;
  label: string;
  factors: Array<{ label: string; impact: number }>;
}

export type { ScoredObservation as FusionSourceDetail };
