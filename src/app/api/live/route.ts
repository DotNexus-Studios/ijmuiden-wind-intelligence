import { fetchFusedRealtimeWind } from "@/lib/fusion/service";
import { discoverAndFetchStations } from "@/lib/rws/stations";
import { computeTrend, formatWindSpeed } from "@/lib/units/wind";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const [fusion, stations] = await Promise.all([
    fetchFusedRealtimeWind(),
    discoverAndFetchStations({ batchTimeoutMs: 8_000, perStationTimeoutMs: 5_000 }),
  ]);

  const history = fusion.history ?? stations.fused?.history ?? [];
  const trend = computeTrend(history.map((h) => h.value));
  const hasLive = fusion.includedCount > 0;
  const activeContributors = fusion.contributors.filter((c) => c.included);

  return NextResponse.json({
    fetchedAt,
    observationTimestamp: fusion.observationTimestamp,
    ageMinutes: fusion.ageMinutes,
    freshness: fusion.freshness,
    hasLive,
    station: stations.primary,
    usedFallback: stations.usedFallback,
    combinedSources: fusion.combinedSources,
    sourceLabel: fusion.primarySource,
    contributors: activeContributors,
    rwsError: stations.rwsError ?? null,
    fusion,
    live: hasLive
      ? {
          speedMs: fusion.speedMs,
          gustMs: fusion.gustMs,
          directionDeg: fusion.directionDeg,
          trend,
          formatted: formatWindSpeed(fusion.speedMs),
        }
      : null,
  });
}
