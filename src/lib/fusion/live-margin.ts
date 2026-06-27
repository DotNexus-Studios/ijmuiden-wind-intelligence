import type { FusedRealtimeWind } from "@/lib/fusion/types";
import { msToKnots } from "@/lib/units/wind";

export interface LiveWindMargin {
  spreadKt: number;
  marginKt: number;
  sourceCount: number;
  fusedKt: number;
  minKt: number;
  maxKt: number;
  label: string;
}

export function computeLiveWindMargin(
  fusion: FusedRealtimeWind | null,
  fusedSpeedMs: number
): LiveWindMargin {
  const fusedKt = msToKnots(fusedSpeedMs);
  const included =
    fusion?.observations.filter((o) => o.included) ??
    fusion?.sources.filter((o) => o.included) ??
    [];

  if (included.length === 0) {
    return {
      spreadKt: 0,
      marginKt: 0,
      sourceCount: 0,
      fusedKt: Math.round(fusedKt),
      minKt: Math.round(fusedKt),
      maxKt: Math.round(fusedKt),
      label: "Geen live bronnen",
    };
  }

  const speedsKt = included.map((o) => msToKnots(o.speedMs));
  const minKt = Math.min(...speedsKt);
  const maxKt = Math.max(...speedsKt);
  const spreadKt = maxKt - minKt;
  const marginKt = Math.max(0.5, Math.round((spreadKt / 2) * 10) / 10);

  const label =
    included.length === 1
      ? `±${marginKt} kt (1 bron)`
      : `±${marginKt} kt (${included.length} bronnen, ${minKt.toFixed(0)}-${maxKt.toFixed(0)} kt)`;

  return {
    spreadKt: Math.round(spreadKt * 10) / 10,
    marginKt,
    sourceCount: included.length,
    fusedKt: Math.round(fusedKt),
    minKt: Math.round(minKt),
    maxKt: Math.round(maxKt),
    label,
  };
}
