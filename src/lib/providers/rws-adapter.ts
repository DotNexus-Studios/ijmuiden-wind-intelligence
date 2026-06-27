import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";
import { observationAgeMinutes, rwsClient } from "@/lib/rws/client";
import { IJMUIDEN_STATIONS } from "@/lib/rws/stations";

function rwsToObservation(
  station: (typeof IJMUIDEN_STATIONS)[0],
  latest: ReturnType<typeof rwsClient.parseLatestBatchForStation>
): WindObservation | null {
  const speed = latest.speed?.value;
  if (speed == null) return null;

  const speedObs = latest.speed!;
  const timestamp = speedObs.timestamp;
  return prepareObservation({
    id: `rws-${station.code}`,
    provider: "rws",
    providerLabel: "RWS",
    stationId: station.code,
    stationName: station.name,
    latitude: station.lat,
    longitude: station.lon,
    distanceKm: haversineKm(
      TARGET_LOCATION.latitude,
      TARGET_LOCATION.longitude,
      station.lat,
      station.lon
    ),
    speedMs: speed,
    gustMs: latest.gust?.value ?? null,
    directionDeg: latest.direction?.value ?? null,
    timestamp,
    ageMinutes: observationAgeMinutes(speedObs),
  });
}

export const rwsProvider: WindProvider = {
  id: "rws",
  label: "Rijkswaterstaat",
  async getWindObservations(): Promise<WindObservation[]> {
    const codes = IJMUIDEN_STATIONS.map((s) => s.code);
    try {
      const batch = await rwsClient.fetchLatestWindBatch(codes, { timeoutMs: 12_000 });
      return IJMUIDEN_STATIONS.map((station) =>
        rwsToObservation(station, rwsClient.parseLatestBatchForStation(batch, station.code))
      ).filter((o): o is WindObservation => o != null);
    } catch {
      const results = await Promise.all(
        IJMUIDEN_STATIONS.map(async (station) => {
          try {
            const { latest } = await rwsClient.fetchWindBundle(station.code, 1, {
              timeoutMs: 8_000,
            });
            return rwsToObservation(station, latest);
          } catch {
            return null;
          }
        })
      );
      return results.filter((o): o is WindObservation => o != null);
    }
  },
};
