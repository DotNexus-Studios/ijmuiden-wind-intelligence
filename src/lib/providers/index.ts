import { fuseWindObservations } from "@/lib/fusion/engine";
import type { FusedLiveWind, WindObservation } from "@/lib/fusion/types";
import { cameraAiProvider, wundergroundProvider } from "@/lib/providers/stub-adapters";
import { knmiEdrProvider, knmiOpenDataProvider } from "@/lib/providers/knmi-adapter";
import { metarProvider } from "@/lib/providers/metar-adapter";
import { rwsProvider } from "@/lib/providers/rws-adapter";
import type { WindProvider } from "@/lib/providers/types";
import { wowProvider } from "@/lib/providers/wow-adapter";

export const ALL_PROVIDERS: WindProvider[] = [
  rwsProvider,
  knmiEdrProvider,
  knmiOpenDataProvider,
  metarProvider,
  wowProvider,
  cameraAiProvider,
  wundergroundProvider,
];

function isEnabled(provider: WindProvider): boolean {
  return provider.enabled !== false;
}

export async function fetchAllWindObservations(): Promise<{
  observations: WindObservation[];
  providerResults: Array<{ id: string; count: number; error?: string }>;
}> {
  const providers = ALL_PROVIDERS.filter(isEnabled);
  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const obs = await provider.getWindObservations();
      return { provider, obs };
    })
  );

  const observations: WindObservation[] = [];
  const providerResults: Array<{ id: string; count: number; error?: string }> = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const provider = providers[i];
    if (result.status === "fulfilled") {
      observations.push(...result.value.obs);
      providerResults.push({ id: provider.id, count: result.value.obs.length });
    } else {
      providerResults.push({
        id: provider.id,
        count: 0,
        error: result.reason instanceof Error ? result.reason.message : "Onbekende fout",
      });
    }
  }

  return { observations, providerResults };
}

export async function fetchFusedWind(): Promise<{
  fused: FusedLiveWind | null;
  observations: WindObservation[];
  providerResults: Array<{ id: string; count: number; error?: string }>;
}> {
  const { observations, providerResults } = await fetchAllWindObservations();
  const fused = fuseWindObservations(observations);
  return { fused, observations, providerResults };
}

export type { WindProvider, WindObservation, FusedLiveWind };
