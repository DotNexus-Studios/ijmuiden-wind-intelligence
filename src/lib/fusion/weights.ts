import type { ProviderKind } from "@/lib/fusion/types";

/** Kalibratiepunten voor exponentiele afstandsgewichten */
const DISTANCE_CALIBRATION: Array<[number, number]> = [
  [0, 1.0],
  [2, 0.96],
  [5, 0.88],
  [10, 0.7],
  [20, 0.45],
  [40, 0.2],
  [100, 0.01],
];

/** Kalibratiepunten voor versheidsgewichten (minuten) */
const FRESHNESS_CALIBRATION: Array<[number, number]> = [
  [0, 1.0],
  [5, 0.98],
  [15, 0.92],
  [30, 0.78],
  [60, 0.55],
  [120, 0.25],
  [180, 0.0],
];

function interpolateCalibration(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];

  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return last[1];
}

/** Exponentieel afstandsgewicht: nabije sensoren domineren */
export function distanceWeight(distanceKm: number): number {
  const d = Math.max(0, distanceKm);
  const linear = interpolateCalibration(DISTANCE_CALIBRATION, d);
  const scale = 27;
  const exponential = Math.exp(-d / scale);
  return Math.max(0, Math.min(1, (linear + exponential) / 2));
}

/** Exponentieel versheidsgewicht: oude metingen verliezen snel invloed */
export function freshnessWeight(ageMinutes: number | null): number {
  if (ageMinutes == null) return 0.05;
  const age = Math.max(0, ageMinutes);
  if (age >= 180) return 0;
  const linear = interpolateCalibration(FRESHNESS_CALIBRATION, age);
  const scale = 55;
  const exponential = Math.exp(-age / scale);
  return Math.max(0, Math.min(1, (linear + exponential) / 2));
}

export interface ProviderTrustConfig {
  rws: number;
  knmi: number;
  metar: number;
  wow: number;
  weatherUnderground: number;
  cameraAi: number;
  other: number;
}

export const DEFAULT_PROVIDER_TRUST: ProviderTrustConfig = {
  rws: 1.0,
  knmi: 0.97,
  metar: 0.82,
  wow: 0.55,
  weatherUnderground: 0.45,
  cameraAi: 0.6,
  other: 0.3,
};

export function providerTrust(
  provider: ProviderKind,
  config: ProviderTrustConfig = DEFAULT_PROVIDER_TRUST
): number {
  switch (provider) {
    case "rws":
      return config.rws;
    case "knmi-edr":
    case "knmi-open-data":
      return config.knmi;
    case "metar":
      return config.metar;
    case "wow":
      return config.wow;
    case "weather-underground":
      return config.weatherUnderground;
    case "camera-ai":
      return config.cameraAi;
    default:
      return config.other;
  }
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Tijd-afnemende correctiefactor voor voorspellingsbias t.o.v. live fusie */
export function forecastCorrectionFactor(hoursAhead: number): number {
  if (hoursAhead <= 0) return 1;
  if (hoursAhead <= 3) return 1 - (hoursAhead / 3) * 0.3;
  if (hoursAhead <= 6) return 0.7 - ((hoursAhead - 3) / 3) * 0.3;
  if (hoursAhead <= 12) return 0.4 - ((hoursAhead - 6) / 6) * 0.25;
  if (hoursAhead <= 24) return 0.15 - ((hoursAhead - 12) / 12) * 0.15;
  return 0.05;
}
