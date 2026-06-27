import { msToKnots } from "@/lib/units/wind";
import type { ProviderKind, WindObservation } from "@/lib/fusion/types";

const OUTLIER_KNOTS = 8;
const NEARBY_KM = 25;
const PRIMARY_PROVIDERS: ProviderKind[] = ["rws", "knmi-edr", "knmi-open-data"];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function nearbyObservations(obs: WindObservation, all: WindObservation[]): WindObservation[] {
  return all.filter(
    (o) =>
      o.id !== obs.id &&
      o.available &&
      o.distanceKm <= NEARBY_KM + obs.distanceKm
  );
}

function hasPrimarySupport(obs: WindObservation, all: WindObservation[], diffKn: number): boolean {
  if (!PRIMARY_PROVIDERS.includes(obs.provider)) return false;
  const nearby = nearbyObservations(obs, all).filter((o) => PRIMARY_PROVIDERS.includes(o.provider));
  return nearby.some((o) => Math.abs(msToKnots(o.speedMs - obs.speedMs)) <= OUTLIER_KNOTS * 0.6);
}

export function computeConsistencyScores(
  observations: WindObservation[]
): Map<string, number> {
  const valid = observations.filter((o) => o.available && Number.isFinite(o.speedMs));
  const speedsKn = valid.map((o) => msToKnots(o.speedMs));
  const globalMedian = median(speedsKn);
  const scores = new Map<string, number>();

  for (const obs of observations) {
    if (!obs.available) {
      scores.set(obs.id, 0);
      continue;
    }

    const obsKn = msToKnots(obs.speedMs);
    const nearby = nearbyObservations(obs, valid);

    let referenceMedian = globalMedian;
    if (nearby.length >= 2) {
      referenceMedian = median(nearby.map((o) => msToKnots(o.speedMs)));
    } else if (nearby.length === 1) {
      referenceMedian = msToKnots(nearby[0].speedMs);
    }

    const diff = Math.abs(obsKn - referenceMedian);

    if (diff <= OUTLIER_KNOTS * 0.5) {
      scores.set(obs.id, 1);
    } else if (diff <= OUTLIER_KNOTS) {
      scores.set(obs.id, 0.7);
    } else if (diff <= OUTLIER_KNOTS * 1.5) {
      const reduced = PRIMARY_PROVIDERS.includes(obs.provider) ? 0.45 : 0.25;
      scores.set(obs.id, reduced);
    } else {
      const supported = hasPrimarySupport(obs, valid, diff);
      if (supported && PRIMARY_PROVIDERS.includes(obs.provider)) {
        scores.set(obs.id, 0.35);
      } else {
        scores.set(obs.id, 0.05);
      }
    }
  }

  return scores;
}

export function consistencyExclusionReason(
  obs: WindObservation,
  score: number,
  all: WindObservation[]
): string | undefined {
  if (score >= 0.35) return undefined;
  const nearby = nearbyObservations(obs, all).filter((o) => o.available);
  if (nearby.length === 0) return "Geen vergelijkbare sensoren in de buurt";
  return "Outlier t.o.v. nabije sensoren";
}
