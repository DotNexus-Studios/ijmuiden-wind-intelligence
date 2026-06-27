"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DirectionLabel,
  FreshnessDot,
  LiveBadge,
  StatusBadge,
  TrendArrow,
  WindCompass,
} from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface HeroCardProps {
  data: DashboardData;
  newMeasurement?: boolean;
}

export function HeroCard({ data, newMeasurement }: HeroCardProps) {
  const { decision, live } = data;
  const gustKt = Math.round(msToKnots(live.gustMs));
  const obsTime = data.observationTimestamp;

  return (
    <section className="dashboard-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {UI.currentConditions}
            </p>
            <LiveBadge />
          </div>
          {live.station && (
            <p className="text-sm text-muted-foreground">RWS {live.station.station.name}</p>
          )}
        </div>
        {newMeasurement && (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
            {UI.newMeasurement}
          </Badge>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <StatusBadge status={decision.status} size="hero" />
          <div className="mt-4 max-w-xs">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">{UI.confidence}</span>
              <span className="font-semibold text-emerald-600">{decision.confidence}%</span>
            </div>
            <Progress value={decision.confidence} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-lg">{decision.explanation}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
          <Metric label={UI.wind} value={`${live.formatted.knots} kn`} sub={`${live.formatted.ms} m/s`} />
          <Metric label={UI.gusts} value={`${gustKt} kn`} sub={`${Math.round(live.gustMs * 3.6)} km/u`} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{UI.direction}</p>
            <DirectionLabel direction={live.directionDeg} />
            <div className="mt-2 scale-75 origin-left">
              <WindCompass direction={live.directionDeg} size="sm" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{UI.trend}</p>
            <TrendArrow trend={live.trend} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <FreshnessDot level={live.freshness} />
          {obsTime ? (
            <span>
              {UI.lastUpdate}: <strong className="text-foreground">{formatObservationClock(obsTime)}</strong>
              {" · "}
              {formatDistanceToNow(new Date(obsTime), { addSuffix: true, locale: nl })}
            </span>
          ) : (
            <span>{UI.noLiveData}</span>
          )}
        </div>
        <span>
          {UI.synced}{" "}
          {formatDistanceToNow(new Date(data.syncedAt), { addSuffix: true, locale: nl })}
        </span>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function StationCompassCard({ data }: HeroCardProps) {
  const { live } = data;
  const station = live.station;

  return (
    <section className="dashboard-card p-5">
      <div className="grid sm:grid-cols-2 gap-4 items-center">
        <WindCompass direction={live.directionDeg} size="lg" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{station?.station.name ?? "IJmuiden"} (RWS)</p>
          {station && (
            <>
              <Row label="Afstand" value={`${station.distanceKm.toFixed(1)} km`} />
              <Row label="Coördinaten" value={`${station.station.lat.toFixed(4)}, ${station.station.lon.toFixed(4)}`} />
              <Row
                label="Data leeftijd"
                value={
                  live.ageMinutes != null
                    ? `${Math.round(live.ageMinutes)} min`
                    : "Onbekend"
                }
              />
            </>
          )}
          <DirectionLabel direction={live.directionDeg} />
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
