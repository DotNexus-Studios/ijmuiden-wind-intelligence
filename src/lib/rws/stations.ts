import { IJMUIDEN } from "@/lib/constants";
import { observationAgeMinutes, rwsClient, type RwsObservationBundle } from "@/lib/rws/client";

export interface StationDefinition {
  code: string;
  name: string;
  lat: number;
  lon: number;
  priority: number;
}

export const IJMUIDEN_STATIONS: StationDefinition[] = [
  {
    code: "ijmuiden.buitenhaven",
    name: "IJmuiden Buitenhaven",
    lat: 52.459,
    lon: 4.589,
    priority: 1,
  },
  {
    code: "ijmuiden",
    name: "IJmuiden",
    lat: 52.462,
    lon: 4.595,
    priority: 2,
  },
  {
    code: "hoekvanholland",
    name: "Hoek van Holland",
    lat: 51.994,
    lon: 4.12,
    priority: 3,
  },
  {
    code: "cadzand.2",
    name: "Cadzand",
    lat: 51.378,
    lon: 3.372,
    priority: 4,
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
}

export interface StationSelection {
  primary: StationReading | null;
  fallbacks: StationReading[];
  all: StationReading[];
  usedFallback: boolean;
}

export async function discoverAndFetchStations(): Promise<StationSelection> {
  const readings = await Promise.all(
    IJMUIDEN_STATIONS.map(async (station) => {
      try {
        const { latest, history } = await rwsClient.fetchWindBundle(station.code, 6, {
          timeoutMs: 8_000,
        });
        const hasData = latest.speed != null;
        const ageMinutes = observationAgeMinutes(latest.speed);

        return {
          station,
          distanceKm: haversineKm(IJMUIDEN.lat, IJMUIDEN.lon, station.lat, station.lon),
          latest,
          history: history.speed.map((s) => ({ value: s.value, timestamp: s.timestamp })),
          ageMinutes,
          available: hasData,
        } satisfies StationReading;
      } catch {
        return {
          station,
          distanceKm: haversineKm(IJMUIDEN.lat, IJMUIDEN.lon, station.lat, station.lon),
          latest: {},
          history: [],
          ageMinutes: null,
          available: false,
        } satisfies StationReading;
      }
    })
  );

  const available = readings
    .filter((r) => r.available)
    .sort((a, b) => {
      const ageA = a.ageMinutes ?? 999;
      const ageB = b.ageMinutes ?? 999;
      if (Math.abs(ageA - ageB) > 5) return ageA - ageB;
      return a.station.priority - b.station.priority;
    });

  const primary = available[0] ?? null;
  const fallbacks = available.slice(1);

  return {
    primary,
    fallbacks,
    all: readings,
    usedFallback: primary != null && primary.station.priority > 1,
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
        lat: l.Geometrie?.punt?.y ?? l.Y ?? IJMUIDEN.lat,
        lon: l.Geometrie?.punt?.x ?? l.X ?? IJMUIDEN.lon,
        priority: 10 + i,
      }));

    if (ijmuidenLocs.length > 0) {
      return [...IJMUIDEN_STATIONS, ...ijmuidenLocs];
    }
  } catch {
    // Catalog optional
  }
  return IJMUIDEN_STATIONS;
}
