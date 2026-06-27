"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectionLabel, StatusBadge } from "@/components/dashboard/wind-display";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { buildSportSnapshots, toDisplayStatus, type SportId } from "@/lib/watersport/sports";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { msToKnots } from "@/lib/units/wind";

interface StickyBarProps {
  data: DashboardData;
  sport: SportId;
  riderWeight: RiderWeight;
  onRefresh: () => void;
  loading?: boolean;
}

export function StickyDecisionBar({
  data,
  sport,
  riderWeight,
  onRefresh,
  loading,
}: StickyBarProps) {
  const { live, fusion } = data;
  const snapshot = buildSportSnapshots(data, riderWeight)[sport];
  const displayStatus = toDisplayStatus(snapshot.status);

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/98 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] safe-bottom">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 py-2 min-w-0 w-full">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
          <StatusBadge status={displayStatus} size="sm" className="shrink-0 !text-[9px] sm:!text-[10px]" />

          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar whitespace-nowrap text-center">
            <Inline label={UI.wind} value={`${live.formatted.knots} kn`} />
            <Inline
              label={UI.direction}
              value={<DirectionLabel direction={live.directionDeg} compact />}
            />
            <Inline label={UI.gusts} value={`${Math.round(msToKnots(live.gustMs))} kn`} />

            {sport === "surf" && snapshot.waveHeightCm != null && (
              <>
                <Inline label={UI.waveHeight} value={`${snapshot.waveHeightCm} cm`} />
                <Inline
                  label={UI.wavePeriod}
                  value={`${snapshot.wavePeriodS?.toFixed(1) ?? "-"} s`}
                />
              </>
            )}

            {sport !== "surf" && (
              <Inline
                label={sport === "kite" ? UI.kite : UI.wing}
                value={snapshot.equipment}
              />
            )}

            <Inline
              label={UI.confidence}
              value={`${fusion?.confidence ?? snapshot.confidence}%`}
            />
            <Inline label={UI.margin} value={`±${live.margin.marginKt} kn`} />

            {data.observationTimestamp && (
              <Inline
                label={UI.lastUpdate}
                value={formatObservationClock(data.observationTimestamp)}
              />
            )}
          </div>

          <Button
            size="icon"
            className="shrink-0 bg-primary hover:bg-primary/90 h-8 w-8 sm:h-9 sm:w-9"
            onClick={onRefresh}
            disabled={loading}
            aria-label={UI.refresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-white ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Inline({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="shrink-0 px-0.5">
      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase leading-none">{label}</p>
      <p className="text-[10px] sm:text-xs font-bold tabular-nums text-slate-900 leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}
