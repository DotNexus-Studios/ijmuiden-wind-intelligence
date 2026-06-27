import { directionToCompass, msToKnots, type WindTrend } from "@/lib/units/wind";
import { WEIGHT_LABELS } from "@/lib/i18n/nl";
import type { GoStatus, SafetyAssessment } from "@/lib/watersport/safety";
import type { RiderWeight } from "@/lib/watersport/kite-size";

export interface WingSizeResult {
  primary: string;
  range: string;
  sizeM2: number;
  notes: string;
}

export interface WingfoilSetupResult {
  wing: WingSizeResult;
  foilCm2: number;
  foilLabel: string;
  mastCm: number;
  summary: string;
}

const WEIGHT_KG: Record<RiderWeight, number> = {
  light: 65,
  medium: 80,
  heavy: 95,
};

export function recommendWingSize(
  windSpeedMs: number,
  weight: RiderWeight = "medium"
): WingSizeResult {
  const knots = msToKnots(windSpeedMs);
  const kg = WEIGHT_KG[weight];

  let sizeM2: number;
  if (knots < 8) sizeM2 = 6;
  else if (knots < 12) sizeM2 = 5;
  else if (knots < 16) sizeM2 = weight === "heavy" ? 5 : 4.5;
  else if (knots < 20) sizeM2 = weight === "light" ? 4 : 3.5;
  else if (knots < 25) sizeM2 = weight === "heavy" ? 3.5 : 3;
  else if (knots < 30) sizeM2 = 2.5;
  else sizeM2 = 2;

  if (weight === "light" && knots > 18) sizeM2 = Math.max(2, sizeM2 - 0.5);
  if (weight === "heavy" && knots < 16) sizeM2 = Math.min(6, sizeM2 + 0.5);

  const low = Math.max(2, Math.round((sizeM2 - 0.5) * 10) / 10);
  const high = Math.min(7, Math.round((sizeM2 + 0.5) * 10) / 10);

  return {
    primary: `${sizeM2}m²`,
    range: `${low}-${high}m²`,
    sizeM2,
    notes:
      knots < 10
        ? "Weinig wind voor wingfoil - grotere wing of wacht op meer wind."
        : knots > 28
          ? "Harde wind - kleine wing, alleen voor ervaren riders."
          : `Geschikt wingbereik voor ${WEIGHT_LABELS[weight].toLowerCase()} riders (${kg} kg).`,
  };
}

export function recommendWingfoilSetup(
  windSpeedMs: number,
  weight: RiderWeight = "medium"
): WingfoilSetupResult {
  const wing = recommendWingSize(windSpeedMs, weight);
  const knots = msToKnots(windSpeedMs);

  let foilCm2: number;
  if (knots < 12) {
    foilCm2 = weight === "heavy" ? 2000 : weight === "light" ? 2200 : 2100;
  } else if (knots < 16) {
    foilCm2 = weight === "heavy" ? 1800 : weight === "light" ? 1700 : 1750;
  } else if (knots < 20) {
    foilCm2 = weight === "heavy" ? 1500 : 1400;
  } else if (knots < 25) {
    foilCm2 = weight === "light" ? 1200 : 1250;
  } else {
    foilCm2 = 1000;
  }

  const mastCm = knots < 14 ? 75 : knots < 22 ? 75 : 60;

  return {
    wing,
    foilCm2,
    foilLabel: `${foilCm2} cm²`,
    mastCm,
    summary: `${wing.primary} wing · ${foilCm2} cm² foil · ${mastCm} cm mast`,
  };
}

export interface WingfoilInput {
  windSpeedMs: number;
  gustMs: number;
  directionDeg: number;
  trend: WindTrend;
  confidence: number;
  riderWeight?: RiderWeight;
}

export function assessWingfoil(input: WingfoilInput): SafetyAssessment {
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
    warnings.push("Onder 10 kn is wingfoilen voor de meeste riders lastig.");
  } else if (knots >= 32 || gustKnots >= 38) {
    status = "NO GO";
    warnings.push("Te harde wind voor veilig wingfoilen.");
  } else if (knots >= 26 || gustKnots >= 32) {
    status = "EXPERT ONLY";
    warnings.push("Sterke condities - kleine wing, ervaren riders.");
  } else if (gustKnots - knots > 12) {
    status = status === "GO" ? "WAIT" : status;
    warnings.push("Grote windvlagen - wisselvallige condities.");
  }

  if (input.directionDeg >= 45 && input.directionDeg < 135) {
    status = status === "GO" ? "EXPERT ONLY" : status;
    warnings.push("Offshore wind - extra voorzichtigheid en reddingsplan.");
  }

  if (input.confidence < 50) {
    if (status === "GO") status = "WAIT";
    warnings.push("Lage betrouwbaarheid - check condities ter plaatse.");
  }

  const weight = input.riderWeight ?? "medium";
  const wing = recommendWingSize(input.windSpeedMs, weight);
  const trendWord =
    input.trend === "rising" ? "oplopend" : input.trend === "dropping" ? "afnemend" : "stabiel";

  return {
    status,
    explanation: `Wingfoil: wind ${windChar}, ${trendWord}, ${Math.round(knots)}-${Math.round(gustKnots)} kn. ${wing.notes} Aanbevolen wing ${wing.primary}.`,
    warnings,
    windCharacter: windChar,
  };
}

/** Windbereik (kn) voor groene zone in voorspellingsgrafiek */
export const WING_GO_WIND_KN = { minKn: 10, maxKn: 26 } as const;
