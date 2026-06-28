import { analyzeTideFromSeaLevel, type TideInfo } from "@/lib/marine/tide";
import type { MarinePoint } from "@/lib/marine/open-meteo-marine";
import { surfEffectiveHeightCm } from "@/lib/watersport/surf";

export interface WaterInfo {
  tide: TideInfo;
  waterTempC: number | null;
  wavePeriodS: number | null;
  waveHeightCm: number | null;
  source: string;
}

function pickNowMarinePoint(points: MarinePoint[]): MarinePoint | null {
  if (!points.length) return null;
  const now = Date.now();
  return points.reduce((best, p) => {
    const diff = Math.abs(new Date(p.time).getTime() - now);
    const bestDiff = Math.abs(new Date(best.time).getTime() - now);
    return diff < bestDiff ? p : best;
  });
}

export function buildWaterInfo(points: MarinePoint[]): WaterInfo {
  const now = pickNowMarinePoint(points);
  const tide = analyzeTideFromSeaLevel(
    points.map((p) => p.time),
    points.map((p) => p.seaLevelM)
  );

  return {
    tide,
    waterTempC: now?.seaSurfaceTempC ?? null,
    wavePeriodS: now?.wavePeriodS ?? null,
    waveHeightCm: now
      ? surfEffectiveHeightCm(now.waveHeightM, now.swellHeightM ?? 0)
      : null,
    source: "Open-Meteo Marine · IJmuiden aan zee",
  };
}
