import { TARGET_LOCATION } from "@/lib/config/location";
import {
  observationAgeMinutes,
  rwsClient,
  rwsErrorMessage,
  type RwsObservationBundle,
} from "@/lib/rws/client";
import type { FusedLiveWind } from "@/lib/fusion/types";
import { fetchFusedRealtimeWind } from "@/lib/fusion/service";

export interface StationDefinition {
  code: string;
  name: string;
  lat: number;
  lon: number;
  priority: number;
}

export const IJMUIDEN_STATIONS: StationDefinition[] = [
  {
    code: "ijgeul.1",
    name: "IJGeul, 1",
    lat: 52.463943,
    lon: 4.517596,
    priority: 1,
  },
  {
    code: "ijmuiden.havenhoofd.zuid",
    name: "IJmuiden, havenhoofd, zuid",
    lat: 52.463693,
    lon: 4.532283,
    priority: 2,
  },
];

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

export interface StationReading {
  station: StationDefinition;
  distanceKm: number;
  latest: RwsObservationBundle;
  history: { value: number; timestamp: string }[];
  ageMinutes: number | null;
  available: boolean;
  error?: string;
}

export interface StationSelection {
  /** Gewogen combinatie van alle beschikbare bronnen */
  fused: FusedLiveWind | null;
  /** Enkelvoudige meting (meest recente station) voor detailweergave */
  primary: StationReading | null;
  fallbacks: StationReading[];
  all: StationReading[];
  /** Alleen secundaire station gebruikt (geen IJGeul) */
  usedFallback: boolean;
  /** Meerdere RWS-stations gecombineerd */
  combinedSources: boolean;
  rwsError?: string;
}

export interface DiscoverOptions {
  batchTimeoutMs?: number;
  perStationTimeoutMs?: number;
  skipFallback?: boolean;
}

function readingFromBatch(station: StationDefinition, latest: RwsObservationBundle): StationReading {
  return {
    station,
    distanceKm: haversineKm(TARGET_LOCATION.latitude, TARGET_LOCATION.longitude, station.lat, station.lon),
    latest,
    history: [],
    ageMinutes: observationAgeMinutes(latest.speed),
    available: latest.speed != null,
  };
}

export async function discoverAndFetchStations(
  options: DiscoverOptions = {}
): Promise<StationSelection> {
  const batchTimeout = options.batchTimeoutMs ?? 20_000;
  const perStationTimeout = options.perStationTimeoutMs ?? 12_000;
  const codes = [...new Set(IJMUIDEN_STATIONS.map((s) => s.code))];
  let batchError: string | undefined;
  let readings: StationReading[] = [];

  try {
    const batch = await rwsClient.fetchLatestWindBatch(codes, { timeoutMs: batchTimeout });
    readings = IJMUIDEN_STATIONS.map((station) =>
      readingFromBatch(station, rwsClient.parseLatestBatchForStation(batch, station.code))
    );
  } catch (err) {
    batchError = rwsErrorMessage(err);
  }

  if (!options.skipFallback) {
    readings = await Promise.all(
      IJMUIDEN_STATIONS.map(async (station) => {
        const existing = readings.find((r) => r.station.code === station.code);
        if (existing?.available) return existing;

        try {
          const { latest, history } = await rwsClient.fetchWindBundle(station.code, 6, {
            timeoutMs: perStationTimeout,
          });
          return {
            station,
            distanceKm: haversineKm(TARGET_LOCATION.latitude, TARGET_LOCATION.longitude, station.lat, station.lon),
            latest,
            history: history.speed.map((s) => ({ value: s.value, timestamp: s.timestamp })),
            ageMinutes: observationAgeMinutes(latest.speed),
            available: latest.speed != null,
          } satisfies StationReading;
        } catch (err) {
          return {
            station,
            distanceKm: haversineKm(TARGET_LOCATION.latitude, TARGET_LOCATION.longitude, station.lat, station.lon),
            latest: existing?.latest ?? {},
            history: existing?.history ?? [],
            ageMinutes: existing?.ageMinutes ?? null,
            available: existing?.available ?? false,
            error: rwsErrorMessage(err),
          } satisfies StationReading;
        }
      })
    );
  } else if (readings.length === 0) {
    readings = IJMUIDEN_STATIONS.map((station) => ({
      station,
      distanceKm: haversineKm(TARGET_LOCATION.latitude, TARGET_LOCATION.longitude, station.lat, station.lon),
      latest: {},
      history: [],
      ageMinutes: null,
      available: false,
      error: batchError,
    }));
  }

  const fusionResult = await fetchFusedRealtimeWind();
  const fused: FusedLiveWind | null =
    fusionResult.includedCount > 0 ? fusionResult : null;
  const result = finalizeSelection(readings, fused);
  if (batchError && !result.fused) result.rwsError = batchError;
  return result;
}

function finalizeSelection(readings: StationReading[], fused: FusedLiveWind | null): StationSelection {

  const available = readings
    .filter((r) => r.available)
    .sort((a, b) => {
      const ageA = a.ageMinutes ?? 999;
      const ageB = b.ageMinutes ?? 999;
      if (Math.abs(ageA - ageB) > 5) return ageA - ageB;
      return a.station.priority - b.station.priority;
    });

  const primary = available[0] ?? null;
  const combinedSources = fused?.combinedSources ?? false;
  const usedFallback =
    fused != null &&
    fused.sourceCount === 1 &&
    fused.contributors[0]?.code !== IJMUIDEN_STATIONS[0].code;

  return {
    fused,
    primary,
    fallbacks: available.slice(1),
    all: readings,
    usedFallback,
    combinedSources,
  };
}

export async function discoverStationsFromCatalog(): Promise<StationDefinition[]> {
  try {
    const catalog = await rwsClient.fetchCatalog({ timeoutMs: 15_000 });
    const locs = catalog.LocatieLijst ?? [];
    const ijmuidenLocs = locs
      .filter((l) => {
        const name = (l.Naam ?? l.Code ?? "").toLowerCase();
        return name.includes("ijmuiden") || name.includes("ijmond");
      })
      .map((l, i) => ({
        code: l.Code ?? `unknown-${i}`,
        name: l.Naam ?? l.Code ?? "Unknown",
        lat: l.Geometrie?.punt?.y ?? l.Y ?? TARGET_LOCATION.latitude,
        lon: l.Geometrie?.punt?.x ?? l.X ?? TARGET_LOCATION.longitude,
        priority: 10 + i,
      }));
    if (ijmuidenLocs.length > 0) return [...IJMUIDEN_STATIONS, ...ijmuidenLocs];
  } catch {
    // optional
  }
  return IJMUIDEN_STATIONS;
}

export type { FusedLiveWind, FusedContributor } from "@/lib/fusion/types";
