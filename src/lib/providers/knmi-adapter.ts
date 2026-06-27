import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";
import { parseOpenMeteoCurrentTime } from "@/lib/providers/time";

const KNMI_GRID = {
  id: "harmonie-ijmuiderstrand",
  name: "HARMONIE IJmuiderstrand",
  lat: TARGET_LOCATION.latitude,
  lon: TARGET_LOCATION.longitude,
} as const;

export const knmiOpenDataProvider: WindProvider = {
  id: "knmi-open-data",
  label: "KNMI",
  async getWindObservations(): Promise<WindObservation[]> {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?" +
          "latitude=52.457&longitude=4.558" +
          "&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
          "&models=knmi_harmonie_arome_europe" +
          "&timezone=Europe%2FAmsterdam",
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!res.ok) return [];

      const json = (await res.json()) as {
        utc_offset_seconds?: number;
        current?: {
          time: string;
          wind_speed_10m: number;
          wind_direction_10m: number;
          wind_gusts_10m?: number;
        };
      };
      const cur = json.current;
      if (!cur?.time) return [];

      const utcOffsetSeconds = json.utc_offset_seconds ?? 0;
      const { timestamp, ageMinutes } = parseOpenMeteoCurrentTime(cur.time, utcOffsetSeconds);

      return [
        prepareObservation({
          id: `knmi-od-${KNMI_GRID.id}`,
          provider: "knmi-open-data",
          providerLabel: "KNMI",
          stationId: KNMI_GRID.id,
          stationName: KNMI_GRID.name,
          latitude: KNMI_GRID.lat,
          longitude: KNMI_GRID.lon,
          distanceKm: haversineKm(
            TARGET_LOCATION.latitude,
            TARGET_LOCATION.longitude,
            KNMI_GRID.lat,
            KNMI_GRID.lon
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
