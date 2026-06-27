import { IJMUIDEN } from "@/lib/constants";
import { rwsClient } from "@/lib/rws/client";
import { IJMUIDEN_STATIONS } from "@/lib/rws/stations";
import { msToKnots } from "@/lib/units/wind";
import { ALL_MODEL_ADAPTERS } from "@/lib/weather-models/open-meteo-base";

export interface SourceCheckResult {
  id: string;
  name: string;
  type: "rws" | "forecast";
  ok: boolean;
  latencyMs: number;
  error?: string;
  data?: Record<string, unknown>;
}

function findNowPoint(
  times: string[],
  speedMs: number[],
  direction?: number[],
  gustMs?: number[]
) {
  const now = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return {
    time: times[bestIdx],
    speedMs: speedMs[bestIdx],
    directionDeg: direction?.[bestIdx],
    gustMs: gustMs?.[bestIdx],
  };
}

export async function checkAllSources(): Promise<SourceCheckResult[]> {
  const results: SourceCheckResult[] = [];

  await Promise.all(
    IJMUIDEN_STATIONS.map(async (station) => {
      const t0 = Date.now();
      try {
        const { latest, history } = await rwsClient.fetchWindBundle(station.code, 6, {
          timeoutMs: 10_000,
        });
        results.push({
          id: station.code,
          name: station.name,
          type: "rws",
          ok: latest.speed != null,
          latencyMs: Date.now() - t0,
          data: {
            speedMs: latest.speed?.value,
            speedKt: latest.speed ? Math.round(msToKnots(latest.speed.value)) : null,
            gustMs: latest.gust?.value,
            directionDeg: latest.direction?.value,
            timestamp: latest.speed?.timestamp,
            historyPoints: history.speed.length,
          },
        });
      } catch (err) {
        results.push({
          id: station.code,
          name: station.name,
          type: "rws",
          ok: false,
          latencyMs: Date.now() - t0,
          error: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    })
  );

  await Promise.all(
    ALL_MODEL_ADAPTERS.map(async (adapter) => {
      const t0 = Date.now();
      try {
        const forecast = await adapter.fetch(IJMUIDEN.lat, IJMUIDEN.lon, 48);
        const now = findNowPoint(
          forecast.points.map((p) => p.time),
          forecast.points.map((p) => p.speedMs),
          forecast.points.map((p) => p.directionDeg),
          forecast.points.map((p) => p.gustMs ?? p.speedMs * 1.25)
        );
        results.push({
          id: adapter.id,
          name: adapter.label,
          type: "forecast",
          ok: forecast.points.length > 0,
          latencyMs: Date.now() - t0,
          data: {
            points: forecast.points.length,
            speedMs: now.speedMs,
            speedKt: Math.round(msToKnots(now.speedMs ?? 0)),
            directionDeg: now.directionDeg,
            gustMs: now.gustMs,
            time: now.time,
          },
        });
      } catch (err) {
        results.push({
          id: adapter.id,
          name: adapter.label,
          type: "forecast",
          ok: false,
          latencyMs: Date.now() - t0,
          error: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    })
  );

  return results;
}
