import { directionToCompass, msToKnots, type WindTrend } from "@/lib/units/wind";
import { recommendKiteSize, type RiderWeight } from "@/lib/watersport/kite-size";
import { WEIGHT_LABELS } from "@/lib/i18n/nl";

export type GoStatus = "GO" | "WAIT" | "NO GO" | "EXPERT ONLY";

export interface SafetyAssessment {
  status: GoStatus;
  explanation: string;
  warnings: string[];
  windCharacter: string;
}

export interface SafetyInput {
  windSpeedMs: number;
  gustMs: number;
  directionDeg: number;
  trend: WindTrend;
  confidence: number;
  riderWeight?: RiderWeight;
}

function classifyWindDirection(deg: number): string {
  const compass = directionToCompass(deg);
  if (deg >= 225 && deg <= 315) return `side-onshore uit ${compass}`;
  if (deg >= 135 && deg < 225) return `onshore uit ${compass}`;
  if (deg >= 315 || deg < 45) return `side-shore uit ${compass}`;
  if (deg >= 45 && deg < 135) return `offshore uit ${compass} - oppassen`;
  return `uit ${compass}`;
}

export function assessSafety(input: SafetyInput): SafetyAssessment {
  const knots = msToKnots(input.windSpeedMs);
  const gustKnots = msToKnots(input.gustMs);
  const warnings: string[] = [];
  let status: GoStatus = "GO";
  const windChar = classifyWindDirection(input.directionDeg);

  if (knots < 10) {
    status = "WAIT";
    warnings.push("Wind onder 10 kn - de meeste kiters hebben meer wind nodig.");
  } else if (knots >= 35 || gustKnots >= 40) {
    status = "NO GO";
    warnings.push("Gevaarlijke windsnelheden voor de meeste riders.");
  } else if (knots >= 28 || gustKnots >= 35) {
    status = "EXPERT ONLY";
    warnings.push("Sterke condities - alleen ervaren riders met kleine kites.");
  } else if (gustKnots - knots > 10) {
    status = status === "GO" ? "WAIT" : status;
    warnings.push("Grote verschillen tussen wind en vlagen - wisselvallig.");
  }

  if (input.directionDeg >= 45 && input.directionDeg < 135) {
    status = status === "GO" ? "EXPERT ONLY" : status;
    warnings.push("Offshore wind - niet varen zonder reddingsplan.");
  }

  if (input.trend === "rising" && knots > 20) {
    if (status === "GO") status = "WAIT";
    warnings.push("Wind neemt toe - condities kunnen snel veranderen.");
  }

  if (input.confidence < 50) {
    if (status === "GO") status = "WAIT";
    warnings.push("Lage betrouwbaarheid - check condities op het strand.");
  }

  const weight = input.riderWeight ?? "medium";
  const kite = recommendKiteSize(input.windSpeedMs, weight);
  const trendWord =
    input.trend === "rising" ? "oplopend" : input.trend === "dropping" ? "afnemend" : "stabiel";

  return {
    status,
    explanation: `Wind is ${windChar}, ${trendWord}, ${Math.round(knots)}-${Math.round(gustKnots)} kn. ${kite.notes} Aanbevolen ${kite.primary} voor ${WEIGHT_LABELS[weight].toLowerCase()} riders.`,
    warnings,
    windCharacter: windChar,
  };
}

export function statusColor(status: GoStatus): string {
  switch (status) {
    case "GO": return "var(--status-go)";
    case "WAIT": return "var(--status-wait)";
    case "EXPERT ONLY": return "var(--status-expert)";
    case "NO GO": return "var(--status-nogo)";
  }
}
