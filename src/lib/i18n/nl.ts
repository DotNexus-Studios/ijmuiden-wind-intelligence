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

export const UI = {
  appTitle: "IJmuiden Wind Intelligence",
  appSubtitle: "RWS live · Multi-model voorspelling",
  navDashboard: "Dashboard",
  navForecast: "Voorspelling",
  navTools: "Tools",
  navStations: "Stations",
  currentConditions: "Huidige omstandigheden",
  live: "Live",
  instantDecision: "Directe beslissing",
  confidence: "Betrouwbaarheid",
  wind: "Wind",
  gusts: "Windvlagen",
  noLiveData: "Geen live data",
  synced: "Gesynchroniseerd",
  lastUpdate: "Laatste update",
  updated: "Bijgewerkt",
  minutesAgo: "min geleden",
  newMeasurement: "Nieuwe meting ontvangen",
  liveWind: "Live wind",
  average: "Gemiddeld",
  direction: "Richting",
  windFrom: "Wind uit",
  windTo: "Waait naar",
  combinedSources: "Gecombineerd",
  windRose: "Windroos",
  offshoreWind: "Aflandige wind",
  offshoreHint: "Geen kite-advies bij aflandige wind",
  sideOnshoreWind: "Side-onshore",
  onshoreWind: "Aanlandig",
  sideShoreWind: "Side-shore",
  trend: "Trend",
  fallbackStation: "fallback-station",
  forecastTimeline: "Voorspellingsoverzicht",
  forecastOverview: "Voorspellingsoverzicht",
  moreDetail: "Meer detail",
  modelComparison: "Modelvergelijking",
  fused: "Gecombineerd",
  fusedForecast: "Gecombineerde voorspelling",
  stationInfo: "Stationinfo",
  distance: "Afstand",
  coordinates: "Coordinaten",
  height: "Hoogte",
  dataAge: "Dataleeftijd",
  unknown: "Onbekend",
  windGusts: "Wind & vlagen",
  forecastFused: "Voorspelling (gecombineerd)",
  kiteSize: "Kitegrootte calculator",
  range: "Bereik",
  safetyDetails: "Veiligheidscheck",
  confidenceFactors: "Betrouwbaarheidsfactoren",
  stationDetails: "Stationinfo",
  online: "Online",
  offline: "Offline",
  rawDebug: "Ruwe data / debug",
  loadError: "Winddata kon niet geladen worden",
  loadingInitial: "Dashboard laden...",
  loadingLive: "Live RWS-data ophalen...",
  loadingLiveHint: "Voorspelling is al zichtbaar. Live metingen kunnen even duren.",
  loadingPreview: "Voorspelling",
  tryAgain: "Opnieuw proberen",
  refresh: "Vernieuwen",
  kite: "Kite",
  tomorrow: "Morgen",
  safeToGo: "Veilig om te gaan",
} as const;

export function formatTimelineLabel(label: string): string {
  const map: Record<string, string> = {
    Nu: "NU",
    "+1u": "+1U",
    "+3u": "+3U",
    "+6u": "+6U",
    "+12u": "+12U",
    "+24u": "+24U",
    "+48u": "+48U",
  };
  if (map[label]) return map[label];
  return label.replace(/u$/, "U").toUpperCase();
}

export function formatObservationClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
