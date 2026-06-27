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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <StatusBadge status={decision.status} size="sm" className="shrink-0" />
          <BarItem label={UI.confidence} value={`${decision.confidence}%`} />
          <BarItem label={UI.wind} value={`${live.formatted.knots} kn`} />
          <BarItem label={UI.gusts} value={`${Math.round(msToKnots(live.gustMs))} kn`} />
          <div className="hidden sm:block shrink-0 text-center min-w-[88px]">
            <p className="text-[10px] text-muted-foreground uppercase">{UI.direction}</p>
            <p className="text-sm font-semibold"><DirectionLabel direction={live.directionDeg} /></p>
          </div>
          <BarItem label={UI.kite} value={kite.range} />
          {data.observationTimestamp && (
            <BarItem label={UI.lastUpdate} value={formatObservationClock(data.observationTimestamp)} />
          )}
          <Button
            size="icon"
            className="shrink-0 ml-auto bg-primary hover:bg-primary/90"
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

function BarItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0 text-center min-w-[64px]">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight text-slate-900">{value}</p>
    </div>
  );
}
