import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";

const KNMI_STATIONS = [
  { id: "240", name: "KNMI IJmuiden", lat: 52.462, lon: 4.556 },
  { id: "235", name: "KNMI Velsen", lat: 52.459, lon: 4.652 },
] as const;

export const knmiOpenDataProvider: WindProvider = {
  id: "knmi-open-data",
  label: "KNMI Open Data",
  async getWindObservations(): Promise<WindObservation[]> {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=52.457&longitude=4.558&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m&models=knmi_harmonie_arome_europe&timezone=Europe%2FAmsterdam",
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!res.ok) return [];

      const json = (await res.json()) as {
        current?: {
          time: string;
          wind_speed_10m: number;
          wind_direction_10m: number;
          wind_gusts_10m?: number;
        };
      };
      const cur = json.current;
      if (!cur) return [];

      const station = KNMI_STATIONS[0];
      const timestamp = new Date(cur.time).toISOString();
      const ageMinutes = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 60_000);

      return [
        prepareObservation({
          id: `knmi-od-${station.id}`,
          provider: "knmi-open-data",
          providerLabel: "KNMI",
          stationId: station.id,
          stationName: station.name,
          latitude: station.lat,
          longitude: station.lon,
          distanceKm: haversineKm(
            TARGET_LOCATION.latitude,
            TARGET_LOCATION.longitude,
            station.lat,
            station.lon
          ),
          speedMs: cur.wind_speed_10m / 3.6,
          gustMs: cur.wind_gusts_10m != null ? cur.wind_gusts_10m / 3.6 : null,
          directionDeg: cur.wind_direction_10m,
          timestamp,
          ageMinutes,
          sensorQuality: 0.85,
        }),
      ];
    } catch {
      return [];
    }
  },
};

export const knmiEdrProvider: WindProvider = {
  id: "knmi-edr",
  label: "KNMI EDR",
  async getWindObservations(): Promise<WindObservation[]> {
    if (!process.env.KNMI_API_KEY) return [];
    return [];
  },
};
