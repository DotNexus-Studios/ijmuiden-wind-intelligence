import { directionSpread } from "@/lib/units/wind";
import type {
  ConfidenceTier,
  FusionConfidenceResult,
  ScoredObservation,
} from "@/lib/fusion/types";

function tierFromScore(score: number): ConfidenceTier {
  if (score >= 95) return "excellent";
  if (score >= 80) return "high";
  if (score >= 60) return "good";
  if (score >= 40) return "low";
  return "unreliable";
}

export function confidenceTierLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case "excellent":
      return "Uitstekend";
    case "high":
      return "Hoog";
    case "good":
      return "Goed";
    case "low":
      return "Laag";
    case "unreliable":
      return "Onbetrouwbaar";
  }
}

export interface FusionConfidenceInput {
  included: ScoredObservation[];
  allScored: ScoredObservation[];
  hasPrimaryRws: boolean;
  hasPrimaryKnmi: boolean;
}

export function computeFusionConfidence(input: FusionConfidenceInput): FusionConfidenceResult {
  const { included, allScored } = input;
  const factors: Array<{ label: string; impact: number }> = [];
  let score = 50;

  const nearby = included.filter((o) => o.distanceKm <= 10);
  const nearbyCount = nearby.length;
  if (nearbyCount >= 3) {
    score += 18;
    factors.push({ label: `${nearbyCount} sensoren binnen 10 km`, impact: 18 });
  } else if (nearbyCount === 2) {
    score += 12;
    factors.push({ label: "Twee sensoren binnen 10 km", impact: 12 });
  } else if (nearbyCount === 1) {
    score += 4;
    factors.push({ label: "Eén sensor binnen 10 km", impact: 4 });
  } else {
    score -= 15;
    factors.push({ label: "Geen sensoren binnen 10 km", impact: -15 });
  }

  const ages = included.map((o) => o.ageMinutes ?? 999).filter((a) => a < 999);
  if (ages.length > 0) {
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    if (avgAge <= 10) {
      score += 15;
      factors.push({ label: "Zeer verse metingen (< 10 min)", impact: 15 });
    } else if (avgAge <= 30) {
      score += 8;
      factors.push({ label: "Redelijk verse metingen", impact: 8 });
    } else if (avgAge <= 60) {
      score -= 5;
      factors.push({ label: "Metingen 30-60 min oud", impact: -5 });
    } else {
      score -= 18;
      factors.push({ label: "Verouderde metingen (> 60 min)", impact: -18 });
    }
  }

  if (included.length >= 2) {
    const distances = included.map((o) => o.distanceKm);
    const spread = Math.max(...distances) - Math.min(...distances);
    if (spread <= 15) {
      score += 8;
      factors.push({ label: "Compacte sensorverdeling", impact: 8 });
    } else if (spread > 40) {
      score -= 8;
      factors.push({ label: "Grote afstand tussen bronnen", impact: -8 });
    }
  }

  const speeds = included.map((o) => o.speedMs);
  if (speeds.length >= 2) {
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const spreadMs = max - min;
    if (spreadMs <= 2) {
      score += 12;
      factors.push({ label: "Sterke overeenstemming tussen sensoren", impact: 12 });
    } else if (spreadMs <= 4) {
      score += 5;
      factors.push({ label: "Matige overeenstemming", impact: 5 });
    } else {
      score -= 10;
      factors.push({ label: "Sensoren verschillen sterk", impact: -10 });
    }
  }

  const providers = new Set(included.map((o) => o.provider));
  if (providers.size >= 3) {
    score += 10;
    factors.push({ label: "Diverse databronnen", impact: 10 });
  } else if (providers.size === 2) {
    score += 5;
    factors.push({ label: "Twee verschillende providers", impact: 5 });
  }

  if (input.hasPrimaryRws) {
    score += 12;
    factors.push({ label: "RWS primair beschikbaar", impact: 12 });
  } else {
    score -= 10;
    factors.push({ label: "Geen RWS live-data", impact: -10 });
  }

  if (input.hasPrimaryKnmi) {
    score += 4;
    factors.push({ label: "KNMI beschikbaar", impact: 4 });
  }

  const directions = included.map((o) => o.directionDeg ?? 270);
  if (directions.length >= 2) {
    const spread = directionSpread(directions);
    if (spread <= 20) {
      score += 8;
      factors.push({ label: "Richting komt overeen", impact: 8 });
    } else if (spread <= 45) {
      score += 2;
      factors.push({ label: "Lichte richtingsverschillen", impact: 2 });
    } else {
      score -= 12;
      factors.push({ label: "Richting wijkt sterk af", impact: -12 });
    }
  }

  const excluded = allScored.filter((o) => !o.included).length;
  if (excluded > 0 && included.length <= 1) {
    score -= 8;
    factors.push({ label: "Meerdere bronnen uitgesloten", impact: -8 });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier = tierFromScore(score);

  if (factors.length === 0) {
    factors.push({ label: "Onvoldoende data voor analyse", impact: 0 });
  }

  return {
    score,
    tier,
    label: confidenceTierLabel(tier),
    factors,
  };
}
