import { NextResponse } from "next/server";
import { freshnessLevel } from "@/lib/rws/client";
import { discoverAndFetchStations } from "@/lib/rws/stations";
import { computeTrend, formatWindSpeed } from "@/lib/units/wind";

export const dynamic = "force-dynamic";

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const stations = await discoverAndFetchStations();
  const fused = stations.fused;

  const speedMs = fused?.speedMs ?? null;
  const gustMs = fused?.gustMs ?? (speedMs != null ? speedMs * 1.25 : null);
  const directionDeg = fused?.directionDeg ?? null;
  const observationTimestamp = fused?.observationTimestamp ?? null;
  const ageMinutes = fused?.ageMinutes ?? null;

  const history = fused?.history ?? [];
  const trend = computeTrend(history.map((h) => h.value));

  return NextResponse.json({
    fetchedAt,
    observationTimestamp,
    ageMinutes,
    freshness: freshnessLevel(ageMinutes),
    hasLive: fused != null,
    station: stations.primary,
    usedFallback: stations.usedFallback,
    combinedSources: stations.combinedSources,
    sourceLabel: fused?.sourceLabel ?? null,
    contributors: fused?.contributors ?? [],
    rwsError: stations.rwsError ?? null,
    live:
      speedMs != null
        ? {
            speedMs,
            gustMs: gustMs ?? speedMs * 1.25,
            directionDeg: directionDeg ?? 270,
            trend,
            formatted: formatWindSpeed(speedMs),
          }
        : null,
  });
}
