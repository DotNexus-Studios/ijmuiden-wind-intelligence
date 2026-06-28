import type { DashboardData } from "@/lib/dashboard";
import { surfEffectiveHeightCm, surfEffectiveHeightM } from "@/lib/watersport/surf";

/** Eén bron voor golfhoogte-weergave: significante hoogte (golf + deining). */
export function getDisplayWaveHeightCm(data: DashboardData): number {
  return Math.round(data.surf.now.effectiveHeightM * 100);
}

export function getDisplayWavePeriodS(data: DashboardData): number {
  return Math.max(data.surf.now.wavePeriodS, data.surf.now.swellPeriodS ?? 0);
}

export function getTimelineWaveHeightCm(
  point: { waveHeightM: number; swellHeightM?: number; effectiveHeightM?: number }
): number {
  if (point.effectiveHeightM != null) {
    return Math.round(point.effectiveHeightM * 100);
  }
  return surfEffectiveHeightCm(point.waveHeightM, point.swellHeightM ?? 0);
}

export function getTimelineEffectiveHeightM(
  point: { waveHeightM: number; swellHeightM?: number; effectiveHeightM?: number }
): number {
  return point.effectiveHeightM ?? surfEffectiveHeightM(point.waveHeightM, point.swellHeightM ?? 0);
}
