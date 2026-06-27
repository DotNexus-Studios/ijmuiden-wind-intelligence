import type { GoStatus } from "@/lib/watersport/safety";
import type { WindTrend } from "@/lib/units/wind";

export const STATUS_LABELS: Record<GoStatus, string> = {
  GO: "GA",
  WAIT: "WACHT",
  "NO GO": "NO GO",
  "EXPERT ONLY": "EXPERT",
};

export const TREND_LABELS: Record<WindTrend, string> = {
  rising: "Oplopend",
  stable: "Stabiel",
  dropping: "Afnemend",
};

export const WEIGHT_LABELS = {
  light: "Licht",
  medium: "Gemiddeld",
  heavy: "Zwaar",
} as const;

export const FRESHNESS_LABELS = {
  green: "Vers (<10 min)",
  orange: "Matig (10-30 min)",
  red: "Verouderd (>30 min)",
} as const;

export const UI = {
  appTitle: "IJmuiden Wind Intelligence",
  appSubtitle: "RWS live · Multi-model voorspelling",
  instantDecision: "Directe beslissing",
  confidence: "Betrouwbaarheid",
  wind: "Wind",
  gusts: "Windvlagen",
  noLiveData: "Geen live data",
  synced: "Gesynchroniseerd",
  updated: "Bijgewerkt",
  minutesAgo: "min geleden",
  liveWind: "Live wind",
  average: "Gemiddeld",
  direction: "Richting",
  trend: "Trend",
  fallbackStation: "fallback-station",
  forecastTimeline: "Voorspelling",
  modelComparison: "Modelvergelijking",
  fused: "Gecombineerd",
  kiteSize: "Kitegrootte",
  range: "Bereik",
  safetyDetails: "Veiligheid",
  confidenceFactors: "Betrouwbaarheidsfactoren",
  stationDetails: "Meetstations",
  online: "Online",
  offline: "Offline",
  rawDebug: "Ruwe data / debug",
  loadError: "Winddata kon niet geladen worden",
  tryAgain: "Opnieuw proberen",
  refresh: "Vernieuwen",
  kite: "Kite",
} as const;

export function formatTimelineLabel(label: string): string {
  const map: Record<string, string> = {
    Now: "Nu",
    "+1h": "+1u",
    "+3h": "+3u",
    "+6h": "+6u",
    "+12h": "+12u",
    "+24h": "+24u",
    "+48h": "+48u",
  };
  if (map[label]) return map[label];
  return label.replace(/h$/, "u");
}
