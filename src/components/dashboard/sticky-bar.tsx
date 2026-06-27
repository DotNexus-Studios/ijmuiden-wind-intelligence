"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import type { DashboardData } from "@/lib/dashboard";

interface StickyBarProps {
  data: DashboardData;
  onRefresh: () => void;
  loading?: boolean;
}

export function StickyDecisionBar({ data, onRefresh, loading }: StickyBarProps) {
  const { decision, live, kite } = data;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md safe-bottom">
      <div className="max-w-lg mx-auto px-3 py-2.5 flex items-center gap-3">
        <StatusBadge status={decision.status} size="sm" className="shrink-0" />
        <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Wind</p>
            <p className="text-lg font-bold tabular-nums leading-tight">{live.formatted.knots}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Gust</p>
            <p className="text-lg font-bold tabular-nums leading-tight">{Math.round(msToKnots(live.gustMs))}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Kite</p>
            <p className="text-lg font-bold leading-tight">{kite.primary}</p>
          </div>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="shrink-0"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
