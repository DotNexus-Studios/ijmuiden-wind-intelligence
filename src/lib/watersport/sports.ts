import { STATUS_LABELS, UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import type { FusedForecastPoint } from "@/lib/weather-models/types";
import { msToKnots } from "@/lib/units/wind";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { assessSafety, type GoStatus } from "@/lib/watersport/safety";
import {
  assessWingfoil,
  recommendWingfoilSetup,
  WING_GO_WIND_KN,
} from "@/lib/watersport/wingfoil";
import { assessWindsurf, recommendSailSize, WINDSURF_GO_WIND_KN } from "@/lib/watersport/windsurf";
import { scoreSurfPoint, type SurfAssessment, type SurfStatus } from "@/lib/watersport/surf";

export type SportId = "kite" | "wingfoil" | "windsurf" | "surf";

export const SPORT_LABELS: Record<SportId, string> = {
  kite: "Kite",
  wingfoil: "Wing foil",
  windsurf: "Windsurf",
  surf: "Surf",
};

export const KITE_GO_WIND_KN = { minKn: 10, maxKn: 28 } as const;

export const PUMP_SPORTS: SportId[] = ["kite", "wingfoil"];

export interface SportSnapshot {
  sport: SportId;
  status: GoStatus | SurfStatus;
  statusLabel: string;
  confidence: number;
  explanation: string;
  warnings: string[];
  equipment: string;
  setupDetails?: string;
  pumpCall?: boolean;
  windKt?: number;
  gustKt?: number;
  waveHeightCm?: number;
  wavePeriodS?: number;
}

function surfStatusLabel(status: SurfStatus): string {
  const map: Record<SurfStatus, string> = {
    GO: "Surf GA",
    WAIT: "Marginaal",
    "NO GO": "Surf NO GO",
    FLAT: "Plat",
  };
  return map[status];
}

function goStatusLabel(sport: SportId, status: GoStatus): string {
  if (PUMP_SPORTS.includes(sport) && status === "GO") return UI.pumpCall;
  return STATUS_LABELS[status];
}

export function getSportWindGoRange(sport: SportId): { minKn: number; maxKn: number } {
  switch (sport) {
    case "wingfoil":
      return WING_GO_WIND_KN;
    case "windsurf":
      return WINDSURF_GO_WIND_KN;
    case "surf":
      return { minKn: 0, maxKn: 999 };
    default:
      return KITE_GO_WIND_KN;
  }
}

export function buildSportSnapshots(
  data: DashboardData,
  riderWeight: RiderWeight
): Record<SportId, SportSnapshot> {
  const { live, decision, kite, surf, fusion } = data;
  const confidence = fusion?.confidence ?? decision.confidence;
  const windKt = live.formatted.knots;
  const gustKt = Math.round(msToKnots(live.gustMs));

  const kiteSafety = assessSafety({
    windSpeedMs: live.speedMs,
    gustMs: live.gustMs,
    directionDeg: live.directionDeg,
    trend: live.trend,
    confidence,
    riderWeight,
  });

  const wingSafety = assessWingfoil({
    windSpeedMs: live.speedMs,
    gustMs: live.gustMs,
    directionDeg: live.directionDeg,
    trend: live.trend,
    confidence,
    riderWeight,
  });
  const wingSetup = recommendWingfoilSetup(live.speedMs, riderWeight);

  const windsurfSafety = assessWindsurf({
    windSpeedMs: live.speedMs,
    gustMs: live.gustMs,
    directionDeg: live.directionDeg,
    trend: live.trend,
    confidence,
    riderWeight,
  });
  const sail = recommendSailSize(live.speedMs, riderWeight);

  return {
    kite: {
      sport: "kite",
      status: kiteSafety.status,
      statusLabel: goStatusLabel("kite", kiteSafety.status),
      confidence,
      explanation: kiteSafety.explanation,
      warnings: kiteSafety.warnings,
      equipment: kite.range,
      pumpCall: kiteSafety.status === "GO",
      windKt,
      gustKt,
    },
    wingfoil: {
      sport: "wingfoil",
      status: wingSafety.status,
      statusLabel: goStatusLabel("wingfoil", wingSafety.status),
      confidence,
      explanation: wingSafety.explanation,
      warnings: wingSafety.warnings,
      equipment: wingSetup.wing.range,
      setupDetails: wingSetup.summary,
      pumpCall: wingSafety.status === "GO",
      windKt,
      gustKt,
    },
    windsurf: {
      sport: "windsurf",
      status: windsurfSafety.status,
      statusLabel: STATUS_LABELS[windsurfSafety.status],
      confidence,
      explanation: windsurfSafety.explanation,
      warnings: windsurfSafety.warnings,
      equipment: sail.range,
      windKt,
      gustKt,
    },
    surf: {
      sport: "surf",
      status: surf.status,
      statusLabel: surfStatusLabel(surf.status),
      confidence,
      explanation: surf.explanation,
      warnings: surf.warnings,
      equipment: surf.headline,
      windKt,
      gustKt,
      waveHeightCm: Math.round(surf.now.effectiveHeightM * 100),
      wavePeriodS: surf.now.wavePeriodS,
    },
  };
}

export function assessForecastPointForSport(
  sport: SportId,
  point: FusedForecastPoint,
  surfTimeline?: SurfAssessment["timeline"]
): GoStatus | SurfStatus {
  if (sport === "surf") {
    if (surfTimeline?.length) {
      const t = new Date(point.time).getTime();
      const match = surfTimeline.reduce((best, p) => {
        const diff = Math.abs(new Date(p.time).getTime() - t);
        const bestDiff = Math.abs(new Date(best.time).getTime() - t);
        return diff < bestDiff ? p : best;
      });
      return match.status;
    }
    const { status } = scoreSurfPoint({
      waveHeightM: 0.5,
      wavePeriodS: 6,
      windSpeedMs: point.speedMs,
      windDirectionDeg: point.directionDeg,
    });
    return status;
  }

  const assess =
    sport === "wingfoil"
      ? assessWingfoil
      : sport === "windsurf"
        ? assessWindsurf
        : assessSafety;

  return assess({
    windSpeedMs: point.speedMs,
    gustMs: point.gustMs,
    directionDeg: point.directionDeg,
    trend: "stable",
    confidence: point.confidence,
  }).status;
}

export function isGoStatus(status: GoStatus | SurfStatus): boolean {
  return status === "GO";
}

export function toDisplayStatus(status: GoStatus | SurfStatus): GoStatus {
  if (status === "FLAT") return "WAIT";
  if (status === "GO") return "GO";
  if (status === "WAIT") return "WAIT";
  if (status === "NO GO") return "NO GO";
  return status as GoStatus;
}
