import type { WindTrend } from "@/lib/units/wind";
import { freshnessLevel } from "@/lib/rws/client";

export interface ConfidenceInput {
  baseConfidence: number;
  dataAgeMinutes: number | null;
  modelDisagreementMs: number;
  trend: WindTrend;
  directionShiftDeg?: number;
  hasLiveData: boolean;
  usedFallbackStation: boolean;
}

export interface ConfidenceResult {
  score: number;
  factors: Array<{ label: string; impact: number }>;
}

export function computeConfidence(input: ConfidenceInput): ConfidenceResult {
  let score = input.baseConfidence;
  const factors: Array<{ label: string; impact: number }> = [];

  const freshness = freshnessLevel(input.dataAgeMinutes);
  if (freshness === "orange") {
    score -= 12;
    factors.push({ label: "Data 10-30 min old", impact: -12 });
  } else if (freshness === "red") {
    score -= 25;
    factors.push({ label: "Stale or missing live data", impact: -25 });
  }

  if (input.modelDisagreementMs > 3) {
    const impact = -Math.min(20, Math.round(input.modelDisagreementMs * 4));
    score += impact;
    factors.push({ label: "Models disagree on wind speed", impact });
  } else if (input.modelDisagreementMs > 1.5) {
    score -= 8;
    factors.push({ label: "Moderate model spread", impact: -8 });
  }

  if (input.trend === "rising") {
    score -= 5;
    factors.push({ label: "Wind rising rapidly", impact: -5 });
  } else if (input.trend === "dropping") {
    score -= 3;
    factors.push({ label: "Wind dropping", impact: -3 });
  }

  if ((input.directionShiftDeg ?? 0) > 30) {
    score -= 10;
    factors.push({ label: "Rapid wind shift", impact: -10 });
  }

  if (!input.hasLiveData) {
    score -= 30;
    factors.push({ label: "No RWS live measurement", impact: -30 });
  }

  if (input.usedFallbackStation) {
    score -= 8;
    factors.push({ label: "Using fallback station", impact: -8 });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (factors.length === 0) factors.push({ label: "All signals aligned", impact: 0 });

  return { score, factors };
}

export function confidenceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Low";
  return "Very low";
}
