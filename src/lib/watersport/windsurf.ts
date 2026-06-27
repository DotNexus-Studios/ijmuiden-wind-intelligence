import { directionToCompass, msToKnots, type WindTrend } from "@/lib/units/wind";
import { WEIGHT_LABELS } from "@/lib/i18n/nl";
import type { GoStatus, SafetyAssessment } from "@/lib/watersport/safety";
import type { RiderWeight } from "@/lib/watersport/kite-size";

const WEIGHT_KG: Record<RiderWeight, number> = {
  light: 65,
  medium: 80,
  heavy: 95,
};

export interface SailSizeResult {
  primary: string;
  range: string;
  sizeM2: number;
  notes: string;
}

export function recommendSailSize(
  windSpeedMs: number,
  weight: RiderWeight = "medium"
): SailSizeResult {
  const knots = msToKnots(windSpeedMs);
  const kg = WEIGHT_KG[weight];

  let sizeM2: number;
  if (knots < 8) sizeM2 = 7.5;
  else if (knots < 11) sizeM2 = 6.5;
  else if (knots < 14) sizeM2 = weight === "heavy" ? 6.5 : 5.5;
  else if (knots < 18) sizeM2 = weight === "light" ? 5.5 : 5;
  else if (knots < 22) sizeM2 = weight === "heavy" ? 5 : 4.5;
  else if (knots < 26) sizeM2 = weight === "light" ? 4.5 : 4;
  else if (knots < 30) sizeM2 = 3.5;
  else sizeM2 = 3;

  if (weight === "light" && knots > 18) sizeM2 = Math.max(3, sizeM2 - 0.5);
  if (weight === "heavy" && knots < 16) sizeM2 = Math.min(8, sizeM2 + 0.5);

  const low = Math.max(3, Math.round((sizeM2 - 0.5) * 10) / 10);
  const high = Math.min(8, Math.round((sizeM2 + 0.5) * 10) / 10);

  return {
    primary: `${sizeM2}m²`,
    range: `${low}-${high}m²`,
    sizeM2,
    notes:
      knots < 10
        ? "Weinig wind - groter zeil of wacht op meer wind."
        : knots > 28
          ? "Harde wind - klein zeil, alleen voor ervaren windsurfers."
          : `Geschikt zeilbereik voor ${WEIGHT_LABELS[weight].toLowerCase()} riders (${kg} kg).`,
  };
}

export interface WindsurfInput {
  windSpeedMs: number;
  gustMs: number;
  directionDeg: number;
  trend: WindTrend;
  confidence: number;
  riderWeight?: RiderWeight;
}

export function assessWindsurf(input: WindsurfInput): SafetyAssessment {
  const knots = msToKnots(input.windSpeedMs);
  const gustKnots = msToKnots(input.gustMs);
  const warnings: string[] = [];
  let status: GoStatus = "GO";
  const compass = directionToCompass(input.directionDeg);
  const windChar =
    input.directionDeg >= 45 && input.directionDeg < 135
      ? `offshore uit ${compass}`
      : `uit ${compass}`;

  if (knots < 10) {
    status = "WAIT";
    warnings.push("Onder 10 kn is windsurfen voor de meeste riders lastig.");
  } else if (knots >= 35 || gustKnots >= 40) {
    status = "NO GO";
    warnings.push("Te harde wind voor veilig windsurfen.");
  } else if (knots >= 28 || gustKnots >= 32) {
    status = "EXPERT ONLY";
    warnings.push("Sterke condities - klein zeil, ervaren windsurfers.");
  } else if (gustKnots - knots > 12) {
    status = status === "GO" ? "WAIT" : status;
    warnings.push("Grote windvlagen - wisselvallige condities.");
  }

  if (input.directionDeg >= 45 && input.directionDeg < 135) {
    status = status === "GO" ? "EXPERT ONLY" : status;
    warnings.push("Offshore wind - extra voorzichtigheid.");
  }

  if (input.confidence < 50) {
    if (status === "GO") status = "WAIT";
    warnings.push("Lage betrouwbaarheid - check condities ter plaatse.");
  }

  const weight = input.riderWeight ?? "medium";
  const sail = recommendSailSize(input.windSpeedMs, weight);
  const trendWord =
    input.trend === "rising" ? "oplopend" : input.trend === "dropping" ? "afnemend" : "stabiel";

  return {
    status,
    explanation: `Windsurf: wind ${windChar}, ${trendWord}, ${Math.round(knots)}-${Math.round(gustKnots)} kn. ${sail.notes} Aanbevolen zeil ${sail.primary}.`,
    warnings,
    windCharacter: windChar,
  };
}

export const WINDSURF_GO_WIND_KN = { minKn: 10, maxKn: 26 } as const;
