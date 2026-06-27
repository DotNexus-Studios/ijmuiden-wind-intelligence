import { TARGET_LOCATION } from "@/lib/config/location";
import { fuseObservations } from "@/lib/fusion/engine";
import type { FusedRealtimeWind } from "@/lib/fusion/types";
import { knmiEdrProvider, knmiOpenDataProvider } from "@/lib/providers/knmi-adapter";
import { metarProvider } from "@/lib/providers/metar-adapter";
import { rwsProvider } from "@/lib/providers/rws-adapter";
import { cameraAiProvider, wundergroundProvider } from "@/lib/providers/stub-adapters";
import type { WindProvider } from "@/lib/providers/types";
import { wowProvider } from "@/lib/providers/wow-adapter";

const ALL_PROVIDERS: WindProvider[] = [
  rwsProvider,
  knmiOpenDataProvider,
  knmiEdrProvider,
  metarProvider,
  wowProvider,
  wundergroundProvider,
  cameraAiProvider,
];

export async function fetchFusedRealtimeWind(): Promise<FusedRealtimeWind> {
  const syncedAt = new Date().toISOString();

  const results = await Promise.allSettled(
    ALL_PROVIDERS.map((p) => p.getWindObservations())
  );

  const observations = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const providerResults = ALL_PROVIDERS.map((provider, i) => {
    const result = results[i];
    if (result.status === "fulfilled") {
      return { id: provider.id, count: result.value.length };
    }
    return {
      id: provider.id,
      count: 0,
      error: result.reason instanceof Error ? result.reason.message : "Onbekende fout",
    };
  });

  const fused = fuseObservations(observations, syncedAt);

  return {
    ...fused,
    debug: {
      ...fused.debug,
      targetLocation: TARGET_LOCATION.name,
      providerResults,
    },
  };
}

export { TARGET_LOCATION };
