import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";
import { mergeObservationBundles, observationAgeMinutes, rwsClient } from "@/lib/rws/client";
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
    const batchPromise = rwsClient
      .fetchLatestWindBatch(codes, { timeoutMs: 12_000 })
      .catch(() => null);

    const results = await Promise.all(
      IJMUIDEN_STATIONS.map(async (station) => {
        const [batch, historyBundle] = await Promise.all([
          batchPromise,
          rwsClient.fetchWindBundle(station.code, 6, { timeoutMs: 10_000 }).catch(() => null),
        ]);

        const fromBatch = batch
          ? rwsClient.parseLatestBatchForStation(batch, station.code)
          : {};
        const fromHistory = historyBundle?.latest ?? {};
        const merged = mergeObservationBundles(fromBatch, fromHistory);

        return rwsToObservation(station, merged);
      })
    );

    return results.filter((o): o is WindObservation => o != null);
  },
};
