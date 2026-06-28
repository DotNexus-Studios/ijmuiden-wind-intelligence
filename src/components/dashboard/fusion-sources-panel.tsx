"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import type { FusedContributor } from "@/lib/fusion/types";
import { msToKnots } from "@/lib/units/wind";
import { DirectionLabel } from "@/components/dashboard/wind-display";
import { cn } from "@/lib/utils";

interface FusionSourcesPanelProps {
  data: DashboardData;
  loading?: boolean;
}

export function FusionSourcesPanel({ data, loading }: FusionSourcesPanelProps) {
  const { live, fusion } = data;
  const contributors = live.contributors.length
    ? live.contributors
    : fusion?.contributors.filter((c) => c.included) ?? [];

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {UI.measurementPoints}
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      ) : contributors.length > 0 ? (
        <ul className="space-y-1.5">
          {contributors.map((c) => (
            <SourceRow key={c.code} contributor={c} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500">{UI.noLiveData}</p>
      )}

      <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1.5">
          {UI.fusedAverage}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-xl font-bold tabular-nums text-slate-900">
              {live.formatted.knots} kn
            </span>
            <span className="text-sm font-semibold text-slate-700">
              <DirectionLabel direction={live.directionDeg} compact />
            </span>
            <span className="text-xs text-slate-500">
              {UI.gusts} {Math.round(msToKnots(live.gustMs))} kn · {UI.margin} {live.margin.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceRow({ contributor }: { contributor: FusedContributor }) {
  const kn = Math.round(msToKnots(contributor.speedMs));
  const age =
    contributor.ageMinutes != null
      ? `${Math.round(contributor.ageMinutes)} ${UI.minutesAgo}`
      : UI.unknown;

  return (
    <li
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm",
        "bg-slate-50/90 border border-slate-100"
      )}
    >
      <div className="min-w-0">
        <p className="font-medium text-slate-800 truncate text-xs sm:text-sm">
          {contributor.providerLabel}
          <span className="text-slate-400 font-normal"> · </span>
          <span className="text-slate-600">{contributor.name}</span>
        </p>
      </div>
      <div className="shrink-0 text-right tabular-nums">
        <p className="font-bold text-slate-900 text-sm">{kn} kn</p>
        <p className="text-[10px] text-slate-500">{age}</p>
      </div>
    </li>
  );
}
