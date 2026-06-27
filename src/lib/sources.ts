import { IJMUIDEN } from "@/lib/constants";
import { rwsClient, rwsErrorMessage } from "@/lib/rws/client";
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

async function checkRwsSources(): Promise<SourceCheckResult[]> {
  const codes = IJMUIDEN_STATIONS.map((s) => s.code);
  const t0 = Date.now();

  try {
    const batch = await rwsClient.fetchLatestWindBatch(codes, { timeoutMs: 15_000 });
    const latencyMs = Date.now() - t0;
    return IJMUIDEN_STATIONS.map((station) => {
      const latest = rwsClient.parseLatestBatchForStation(batch, station.code);
      const hasSpeed = latest.speed != null;
      return {
        id: station.code,
        name: station.name,
        type: "rws",
        ok: hasSpeed,
        latencyMs,
        ...(hasSpeed
          ? {}
          : { error: "Geen windmeting in batch-response" }),
        data: {
          speedMs: latest.speed?.value,
          speedKt: latest.speed ? Math.round(msToKnots(latest.speed.value)) : null,
          gustMs: latest.gust?.value,
          directionDeg: latest.direction?.value,
          timestamp: latest.speed?.timestamp,
          historyPoints: 0,
        },
      };
    });
  } catch (batchErr) {
    const batchError = rwsErrorMessage(batchErr);
    const batchLatency = Date.now() - t0;

    const perStation = await Promise.all(
      IJMUIDEN_STATIONS.map(async (station) => {
        const stationT0 = Date.now();
        try {
          const { latest, history } = await rwsClient.fetchWindBundle(station.code, 6, {
            timeoutMs: 8_000,
          });
          const hasSpeed = latest.speed != null;
          return {
            id: station.code,
            name: station.name,
            type: "rws",
            ok: hasSpeed,
            latencyMs: Date.now() - stationT0,
            error: hasSpeed ? undefined : batchError,
            data: {
              speedMs: latest.speed?.value,
              speedKt: latest.speed ? Math.round(msToKnots(latest.speed.value)) : null,
              gustMs: latest.gust?.value,
              directionDeg: latest.direction?.value,
              timestamp: latest.speed?.timestamp,
              historyPoints: history.speed.length,
            },
          } satisfies SourceCheckResult;
        } catch (err) {
          return {
            id: station.code,
            name: station.name,
            type: "rws",
            ok: false,
            latencyMs: Date.now() - stationT0,
            error: rwsErrorMessage(err),
            data: {
              speedKt: null,
              historyPoints: 0,
            },
          } satisfies SourceCheckResult;
        }
      })
    );

    if (!perStation.some((s) => s.ok)) {
      for (const row of perStation) {
        row.error ??= batchError;
        row.latencyMs = Math.max(row.latencyMs, batchLatency);
      }
    }
    return perStation;
  }
}

export async function checkAllSources(): Promise<SourceCheckResult[]> {
  const results: SourceCheckResult[] = [];

  results.push(...(await checkRwsSources()));

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
