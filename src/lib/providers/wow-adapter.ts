import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";

export const wowProvider: WindProvider = {
  id: "wow",
  label: "WOW-KNMI",
  async getWindObservations(): Promise<WindObservation[]> {
    try {
      const res = await fetch("https://wow.knmi.nl/json/weatherstation?stationid=6260", {
        signal: AbortSignal.timeout(6_000),
      });
      if (!res.ok) return [];

      const json = (await res.json()) as {
        data?: Array<{
          stationName?: string;
          stationId?: string;
          lat?: number;
          lng?: number;
          windspeedMS?: number;
          winddir?: number;
          windgustMS?: number;
          timestamp?: number;
        }>;
      };

      return (json.data ?? [])
        .filter((r) => r.windspeedMS != null && r.winddir != null && r.lat != null && r.lng != null)
        .map((row) => {
          const lat = row.lat!;
          const lon = row.lng!;
          const dist = haversineKm(TARGET_LOCATION.latitude, TARGET_LOCATION.longitude, lat, lon);
          if (dist > 50) return null;

          const timestamp = row.timestamp
            ? new Date(row.timestamp * 1000).toISOString()
            : new Date().toISOString();
          const ageMinutes = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 60_000);

          return prepareObservation({
            id: `wow-${row.stationId ?? "unknown"}`,
            provider: "wow",
            providerLabel: "WOW-KNMI",
            stationId: row.stationId ?? "unknown",
            stationName: row.stationName ?? "WOW Haarlem",
            latitude: lat,
            longitude: lon,
            distanceKm: dist,
            speedMs: row.windspeedMS!,
            gustMs: row.windgustMS ?? null,
            directionDeg: row.winddir!,
            timestamp,
            ageMinutes,
            sensorQuality: 0.7,
          });
        })
        .filter((o): o is WindObservation => o != null);
    } catch {
      return [];
    }
  },
};
