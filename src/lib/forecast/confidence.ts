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
  combinedRwsSources?: boolean;
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
    factors.push({ label: "Data 10-30 min oud", impact: -12 });
  } else if (freshness === "red") {
    score -= 25;
    factors.push({ label: "Verouderde of ontbrekende live data", impact: -25 });
  }

  if (input.modelDisagreementMs > 3) {
    const impact = -Math.min(20, Math.round(input.modelDisagreementMs * 4));
    score += impact;
    factors.push({ label: "Modellen verschillen sterk in windsnelheid", impact });
  } else if (input.modelDisagreementMs > 1.5) {
    score -= 8;
    factors.push({ label: "Matige spreiding tussen modellen", impact: -8 });
  }

  if (input.trend === "rising") {
    score -= 5;
    factors.push({ label: "Wind neemt snel toe", impact: -5 });
  } else if (input.trend === "dropping") {
    score -= 3;
    factors.push({ label: "Wind neemt af", impact: -3 });
  }

  if ((input.directionShiftDeg ?? 0) > 30) {
    score -= 10;
    factors.push({ label: "Snelle winddraaiing", impact: -10 });
  }

  if (!input.hasLiveData) {
    score -= 30;
    factors.push({ label: "Geen RWS live-meting", impact: -30 });
  }

  if (input.usedFallbackStation) {
    score -= 8;
    factors.push({ label: "Slechts een RWS-station beschikbaar", impact: -8 });
  }

  if (input.combinedRwsSources) {
    score += 6;
    factors.push({ label: "Twee RWS-stations gecombineerd", impact: 6 });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  if (factors.length === 0) factors.push({ label: "Alle signalen komen overeen", impact: 0 });

  return { score, factors };
}

export function confidenceLabel(score: number): string {
  if (score >= 80) return "Hoog";
  if (score >= 60) return "Matig";
  if (score >= 40) return "Laag";
  return "Zeer laag";
}
