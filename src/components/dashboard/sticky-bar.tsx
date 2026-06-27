"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectionLabel, StatusBadge } from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";

interface StickyBarProps {
  data: DashboardData;
  onRefresh: () => void;
  loading?: boolean;
}

export function StickyDecisionBar({ data, onRefresh, loading }: StickyBarProps) {
  const { decision, live, kite } = data;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] safe-bottom">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 min-w-0 w-full">
        <div className="flex items-center gap-2 min-w-0 sm:gap-4">
          <StatusBadge status={decision.status} size="sm" className="shrink-0" />

          <div className="flex-1 min-w-0 grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-4 sm:flex-1">
            <BarItem label={UI.wind} value={`${live.formatted.knots} kn`} />
            <BarItem label={UI.gusts} value={`${Math.round(msToKnots(live.gustMs))} kn`} />
            <BarItem label={UI.kite} value={kite.range} className="sm:hidden" />
            <div className="hidden sm:block shrink-0 text-center min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase">{UI.direction}</p>
              <p className="text-sm font-semibold truncate">
                <DirectionLabel direction={live.directionDeg} compact />
              </p>
            </div>
            <BarItem label={UI.kite} value={kite.range} className="hidden sm:block" />
            {data.observationTimestamp && (
              <BarItem
                label={UI.lastUpdate}
                value={formatObservationClock(data.observationTimestamp)}
                className="hidden md:block"
              />
            )}
          </div>

          <Button
            size="icon"
            className="shrink-0 bg-primary hover:bg-primary/90 h-9 w-9"
            onClick={onRefresh}
            disabled={loading}
            aria-label={UI.refresh}
          >
            <RefreshCw className={`h-4 w-4 text-white ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BarItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 text-center ${className ?? ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase truncate">{label}</p>
      <p className="text-xs sm:text-sm font-bold tabular-nums leading-tight text-slate-900 truncate">{value}</p>
    </div>
  );
}
