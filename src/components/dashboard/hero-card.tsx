"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FreshnessDot, StatusBadge, TrendArrow, WindCompass } from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import type { DashboardData } from "@/lib/dashboard";
import { formatDistanceToNow } from "date-fns";

interface HeroCardProps {
  data: DashboardData;
}

export function HeroCard({ data }: HeroCardProps) {
  const { decision, live } = data;
  const gustKt = Math.round(msToKnots(live.gustMs));

  return (
    <Card className="border-0 bg-gradient-to-br from-card via-card to-[#0c1829] shadow-xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Instant decision
            </p>
            <StatusBadge status={decision.status} />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="text-3xl font-bold tabular-nums">{decision.confidence}</p>
            <Progress value={decision.confidence} className="h-1.5 mt-1 w-20 ml-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Wind</p>
            <p className="text-4xl font-bold tabular-nums leading-none">
              {live.formatted.knots}
              <span className="text-lg font-normal text-muted-foreground ml-1">kt</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {live.formatted.ms} m/s · Bft {live.formatted.beaufort}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gusts</p>
            <p className="text-3xl font-bold tabular-nums">
              {gustKt}
              <span className="text-base font-normal text-muted-foreground ml-1">kt</span>
            </p>
            <TrendArrow trend={live.trend} />
          </div>
          <div>
            <WindCompass direction={live.directionDeg} />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground/90">{decision.explanation}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <FreshnessDot level={live.freshness} />
            <span>
              {live.ageMinutes != null
                ? `Updated ${Math.round(live.ageMinutes)} min ago`
                : "No live data"}
            </span>
          </div>
          <span>Synced {formatDistanceToNow(new Date(data.syncedAt), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveWindCard({ data }: HeroCardProps) {
  const { live } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Live wind</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums">{live.formatted.knots}</span>
          <span className="text-xl text-muted-foreground">kt</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <p className="text-muted-foreground">Average</p>
            <p>{live.formatted.ms} m/s · Beaufort {live.formatted.beaufort}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gusts</p>
            <p>{Math.round(msToKnots(live.gustMs))} kt</p>
          </div>
          <div>
            <p className="text-muted-foreground">Direction</p>
            <p>{Math.round(live.directionDeg)}°</p>
          </div>
          <div>
            <p className="text-muted-foreground">Trend</p>
            <TrendArrow trend={live.trend} />
          </div>
        </div>
        {live.station && (
          <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
            {live.station.station.name} · {live.station.distanceKm.toFixed(1)} km
            {live.usedFallback && " · fallback station"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
