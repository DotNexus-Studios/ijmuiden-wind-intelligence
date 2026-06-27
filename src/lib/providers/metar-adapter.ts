import { TARGET_LOCATION } from "@/lib/config/location";
import { prepareObservation } from "@/lib/fusion/engine";
import { haversineKm } from "@/lib/fusion/weights";
import type { WindObservation, WindProvider } from "@/lib/providers/types";
import { parseMetarObservationTime } from "@/lib/providers/time";

interface MetarStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

const METAR_STATIONS: MetarStation[] = [
  { id: "EHAM", name: "Schiphol", lat: 52.3086, lon: 4.7639 },
  { id: "EHKD", name: "Den Helder", lat: 52.9234, lon: 4.781 },
];

interface MetarRow {
  icaoId: string;
  wspd: number | null;
  wdir: number | null;
  gust: number | null;
  obsTime?: number;
  reportTime?: string;
}

function knotsToMs(knots: number): number {
  return knots * 0.514444;
}

export const metarProvider: WindProvider = {
  id: "metar",
  label: "METAR",
  async getWindObservations(): Promise<WindObservation[]> {
    try {
      const res = await fetch(
        "https://aviationweather.gov/api/data/metar?ids=EHAM,EHKD&format=json",
        { signal: AbortSignal.timeout(8_000) }
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as MetarRow[];

      return rows
        .map((row) => {
          const station = METAR_STATIONS.find((s) => s.id === row.icaoId);
          if (!station || row.wspd == null || row.wdir == null) return null;

          const parsed = parseMetarObservationTime(row);
          if (!parsed) return null;

          return prepareObservation({
            id: `metar-${row.icaoId}`,
            provider: "metar",
            providerLabel: "METAR",
            stationId: row.icaoId,
            stationName: station.name,
            latitude: station.lat,
            longitude: station.lon,
            distanceKm: haversineKm(
              TARGET_LOCATION.latitude,
              TARGET_LOCATION.longitude,
              station.lat,
              station.lon
            ),
            speedMs: knotsToMs(row.wspd),
            gustMs: row.gust != null ? knotsToMs(row.gust) : null,
            directionDeg: row.wdir,
            timestamp: parsed.timestamp,
            ageMinutes: parsed.ageMinutes,
          });
        })
        .filter((o): o is WindObservation => o != null);
    } catch {
      return [];
    }
  },
};
