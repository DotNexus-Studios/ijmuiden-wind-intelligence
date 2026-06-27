import { directionToCompass, msToKnots, type WindTrend } from "@/lib/units/wind";
import { recommendKiteSize, type RiderWeight } from "@/lib/watersport/kite-size";

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
  if (deg >= 225 && deg <= 315) return `side-onshore from ${compass}`;
  if (deg >= 135 && deg < 225) return `onshore from ${compass}`;
  if (deg >= 315 || deg < 45) return `side-shore from ${compass}`;
  if (deg >= 45 && deg < 135) return `offshore from ${compass} - caution`;
  return `from ${compass}`;
}

export function assessSafety(input: SafetyInput): SafetyAssessment {
  const knots = msToKnots(input.windSpeedMs);
  const gustKnots = msToKnots(input.gustMs);
  const warnings: string[] = [];
  let status: GoStatus = "GO";
  const windChar = classifyWindDirection(input.directionDeg);

  if (knots < 10) {
    status = "WAIT";
    warnings.push("Wind below 10 kt - most kiters need more wind.");
  } else if (knots >= 35 || gustKnots >= 40) {
    status = "NO GO";
    warnings.push("Dangerous wind speeds for most riders.");
  } else if (knots >= 28 || gustKnots >= 35) {
    status = "EXPERT ONLY";
    warnings.push("Strong conditions - experienced riders with small kites only.");
  } else if (gustKnots - knots > 10) {
    status = status === "GO" ? "WAIT" : status;
    warnings.push("Large gust spread - gusty and unpredictable.");
  }

  if (input.directionDeg >= 45 && input.directionDeg < 135) {
    status = status === "GO" ? "EXPERT ONLY" : status;
    warnings.push("Offshore wind - do not ride unless you have rescue support.");
  }

  if (input.trend === "rising" && knots > 20) {
    if (status === "GO") status = "WAIT";
    warnings.push("Wind building - conditions may change quickly.");
  }

  if (input.confidence < 50) {
    if (status === "GO") status = "WAIT";
    warnings.push("Low confidence in forecast - verify at the beach.");
  }

  const weight = input.riderWeight ?? "medium";
  const kite = recommendKiteSize(input.windSpeedMs, weight);
  const trendWord =
    input.trend === "rising" ? "building" : input.trend === "dropping" ? "easing" : "stable";

  return {
    status,
    explanation: `Wind is ${windChar}, ${trendWord}, ${Math.round(knots)}-${Math.round(gustKnots)} kt. ${kite.notes} Recommended ${kite.primary} for ${weight} riders.`,
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
