import type { DashboardData } from "@/lib/dashboard";
import { UI } from "@/lib/i18n/nl";
import { msToKnots } from "@/lib/units/wind";
import type { SportId, SportSnapshot } from "@/lib/watersport/sports";

export type SportDataFocus = "wind" | "wave" | "mixed";

export interface DisplayMetric {
  label: string;
  value: string;
  sub?: string;
}

export interface StickyColumn {
  label: string;
  value: string;
}

export function getSportDataFocus(sport: SportId): SportDataFocus {
  switch (sport) {
    case "surf":
      return "wave";
    case "windsurf":
      return "mixed";
    default:
      return "wind";
  }
}

function waveHeightCm(data: DashboardData, snapshot: SportSnapshot): number {
  return (
    snapshot.waveHeightCm ??
    data.water.waveHeightCm ??
    Math.round(data.surf.now.effectiveHeightM * 100)
  );
}

function wavePeriodS(data: DashboardData, snapshot: SportSnapshot): number | null {
  return snapshot.wavePeriodS ?? data.water.wavePeriodS ?? data.surf.now.wavePeriodS ?? null;
}

function shortTideLabel(data: DashboardData): string {
  const phase = data.water.tide.phase;
  if (phase === "vloed") return "Vloed";
  if (phase === "eb") return "Eb";
  if (phase === "opkomend") return "Opkomend";
  return "Terug";
}

export function getSportSubtitle(data: DashboardData, sport: SportId, awaitingLive: boolean): string {
  if (awaitingLive && !data.observationTimestamp) return UI.loadingPreview;
  if (sport === "surf") return UI.surfSpot;
  const stationName = data.live.sourceLabel ?? data.live.station?.station.name ?? "IJGeul, 1";
  if (data.live.combinedSources) return `${UI.combinedSources}: ${stationName}`;
  return stationName;
}

export function buildHeroMetrics(
  data: DashboardData,
  sport: SportId,
  snapshot: SportSnapshot
): DisplayMetric[] {
  const { live, water } = data;
  const heightCm = waveHeightCm(data, snapshot);
  const period = wavePeriodS(data, snapshot);
  const periodLabel = period != null ? `${period.toFixed(1)} s` : UI.unknown;
  const temp =
    water.waterTempC != null ? `${water.waterTempC.toFixed(1)} °C` : UI.unknown;

  if (sport === "surf") {
    return [
      { label: UI.waveHeight, value: `${heightCm} cm` },
      { label: UI.waveInterval, value: periodLabel },
      { label: UI.tide, value: water.tide.label },
      { label: UI.waterTemp, value: temp },
    ];
  }

  if (sport === "windsurf") {
    return [
      { label: UI.wind, value: `${live.formatted.knots} kt`, sub: `(${Math.round(live.formatted.ms * 3.6)} km/u)` },
      { label: UI.gusts, value: `${Math.round(msToKnots(live.gustMs))} kt` },
      { label: UI.waveHeight, value: `${heightCm} cm` },
      { label: UI.waveInterval, value: periodLabel },
      { label: UI.tide, value: water.tide.label },
      { label: UI.waterTemp, value: temp },
    ];
  }

  return [];
}

export function buildStickyColumns(
  data: DashboardData,
  sport: SportId,
  snapshot: SportSnapshot,
  confidence: number
): StickyColumn[] {
  const { live } = data;
  const heightCm = waveHeightCm(data, snapshot);
  const period = wavePeriodS(data, snapshot);
  const tide = shortTideLabel(data);

  if (sport === "surf") {
    return [
      { label: UI.waveHeight, value: `${heightCm} cm` },
      { label: UI.waveInterval, value: period != null ? `${period.toFixed(1)} s` : UI.unknown },
      { label: UI.tide, value: tide },
    ];
  }

  if (sport === "windsurf") {
    return [
      { label: UI.wind, value: `${live.formatted.knots} kn` },
      { label: UI.waveHeight, value: `${heightCm} cm` },
      { label: UI.tide, value: tide },
    ];
  }

  return [
    { label: UI.wind, value: `${live.formatted.knots} kn` },
    {
      label: UI.direction,
      value: `${Math.round(live.directionDeg)}°`,
    },
    { label: UI.confidence, value: `${confidence}%` },
  ];
}

export function getSurfSecondaryWind(data: DashboardData): string {
  const kn = data.live.formatted.knots;
  return `${kn} kn · ${Math.round(data.live.directionDeg)}°`;
}
