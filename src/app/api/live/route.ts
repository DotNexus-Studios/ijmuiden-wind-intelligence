import { NextResponse } from "next/server";
import { freshnessLevel, observationAgeMinutes } from "@/lib/rws/client";
import { discoverAndFetchStations } from "@/lib/rws/stations";
import { computeTrend, formatWindSpeed } from "@/lib/units/wind";

export const dynamic = "force-dynamic";

export async function GET() {
  const fetchedAt = new Date().toISOString();
  const stations = await discoverAndFetchStations();
  const primary = stations.primary;

  const speedMs = primary?.latest.speed?.value ?? null;
  const gustMs = primary?.latest.gust?.value ?? (speedMs != null ? speedMs * 1.25 : null);
  const directionDeg = primary?.latest.direction?.value ?? null;
  const observationTimestamp = primary?.latest.speed?.timestamp ?? null;
  const ageMinutes = observationAgeMinutes(primary?.latest.speed);

  const history = primary?.history ?? [];
  const trend = computeTrend(history.map((h) => h.value));

  return NextResponse.json({
    fetchedAt,
    observationTimestamp,
    ageMinutes,
    freshness: freshnessLevel(ageMinutes),
    hasLive: primary != null,
    station: primary,
    usedFallback: stations.usedFallback,
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
