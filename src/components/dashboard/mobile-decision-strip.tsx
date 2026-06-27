"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DirectionLabel, StatusBadge } from "@/components/dashboard/wind-display";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { msToKnots } from "@/lib/units/wind";

interface MobileDecisionStripProps {
  data: DashboardData;
  onRefresh: () => void;
  loading?: boolean;
}

/** Above-the-fold mobile summary: decision + fused wind without scrolling */
export function MobileDecisionStrip({ data, onRefresh, loading }: MobileDecisionStripProps) {
  const { decision, live, kite, fusion } = data;

  return (
    <section className="md:hidden rounded-2xl border border-border bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={decision.status} size="lg" />
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 shrink-0"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {UI.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">{UI.wind}</p>
          <p className="text-xl font-bold tabular-nums">{live.formatted.knots} kn</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">{UI.direction}</p>
          <p className="text-sm font-semibold">
            <DirectionLabel direction={live.directionDeg} compact />
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-muted-foreground">{UI.gusts}</p>
          <p className="text-xl font-bold tabular-nums">{Math.round(msToKnots(live.gustMs))} kn</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm border-t pt-2 gap-2 min-w-0">
        <div className="min-w-0">
          <span className="text-muted-foreground text-xs">{UI.confidence}: </span>
          <span className="font-semibold tabular-nums">
            {fusion?.confidence ?? decision.confidence}%
          </span>
        </div>
        <div className="min-w-0 text-right truncate">
          <span className="text-muted-foreground text-xs">{UI.kite}: </span>
          <span className="font-semibold">{kite.range}</span>
        </div>
      </div>

      {data.observationTimestamp && (
        <p className="text-[11px] text-muted-foreground text-center">
          {UI.lastUpdate}: {formatObservationClock(data.observationTimestamp)}
        </p>
      )}
    </section>
  );
}
