"use client";

import { DirectionLabel, StatusBadge } from "@/components/dashboard/wind-display";
import { Button } from "@/components/ui/button";
import { UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { buildSportSnapshots, toDisplayStatus, type SportId } from "@/lib/watersport/sports";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const confidence = fusion?.confidence ?? snapshot.confidence;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/98 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] safe-bottom">
      <div className="max-w-7xl mx-auto px-3 pt-5 pb-2.5 w-full relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
          <Button
            size="icon"
            className={cn(
              "h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg",
              "border-[3px] border-white hover:bg-primary/90 active:scale-95 transition-transform"
            )}
            onClick={onRefresh}
            disabled={loading}
            aria-label={UI.refresh}
          >
            <RefreshCw className={cn("h-6 w-6", loading && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-4 items-center gap-2 text-center min-w-0">
          <div className="min-w-0 flex flex-col items-center gap-0.5">
            <p className="text-[9px] text-muted-foreground uppercase">{UI.advice}</p>
            <StatusBadge
              status={displayStatus}
              size="sm"
              label={snapshot.pumpCall ? snapshot.statusLabel : undefined}
              className="!text-[9px] sm:!text-[10px]"
            />
          </div>
          <Inline label={UI.wind} value={`${live.formatted.knots} kn`} />
          <Inline
            label={UI.direction}
            value={<DirectionLabel direction={live.directionDeg} compact />}
          />
          <Inline label={UI.confidence} value={`${confidence}%`} />
        </div>
      </div>
    </div>
  );
}

function Inline({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] text-muted-foreground uppercase truncate">{label}</p>
      <p className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 truncate leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}
