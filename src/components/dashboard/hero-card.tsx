"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/dashboard/section-header";
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

export function CurrentConditionsCard({ data, newMeasurement }: HeroCardProps) {
  const { decision, live } = data;
  const gustKt = Math.round(msToKnots(live.gustMs));
  const obsTime = data.observationTimestamp;
  const stationName = live.station?.station.name ?? "IJmuiden Buitenhaven";

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full">
      <SectionHeader
        title={UI.currentConditions}
        action={
          <div className="flex items-center gap-2">
            <LiveBadge />
            {newMeasurement && (
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">
                {UI.newMeasurement}
              </Badge>
            )}
          </div>
        }
      />

      <p className="text-sm text-slate-500 -mt-2 mb-4">RWS {stationName}</p>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 items-start">
        <div>
          <StatusBadge status={decision.status} size="hero" />
          <div className="mt-5 max-w-sm">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-500 font-medium">{UI.confidence}</span>
              <span className="font-bold text-emerald-600">{decision.confidence}%</span>
            </div>
            <Progress value={decision.confidence} className="h-2.5 bg-slate-100 [&>div]:bg-emerald-500" />
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">
            {decision.explanation.split(".").slice(0, 2).join(".")}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <MetricBlock label={UI.wind} value={`${live.formatted.knots} kt`} sub={`(${Math.round(live.formatted.ms * 3.6)} km/u)`} />
          <MetricBlock label={UI.gusts} value={`${gustKt} kt`} sub={`(${Math.round(live.gustMs * 3.6)} km/u)`} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{UI.direction}</p>
            <DirectionLabel direction={live.directionDeg} />
            <div className="mt-1">
              <WindCompass direction={live.directionDeg} size="sm" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{UI.trend}</p>
            <TrendArrow trend={live.trend} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <FreshnessDot level={live.freshness} />
          {obsTime ? (
            <span>
              {UI.lastUpdate}: <strong className="text-slate-700">{formatObservationClock(obsTime)}</strong>
              {" · "}
              {formatDistanceToNow(new Date(obsTime), { addSuffix: true, locale: nl })}
            </span>
          ) : (
            <span>{UI.noLiveData}</span>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export function StationInfoCard({ data }: HeroCardProps) {
  const { live } = data;
  const station = live.station;

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full">
      <SectionHeader title={UI.stationInfo} />
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center">
        <WindCompass direction={live.directionDeg} size="lg" />
        <div className="space-y-2.5 text-sm">
          <p className="font-semibold text-slate-800">
            {station?.station.name ?? "IJmuiden Buitenhaven"} (RWS)
          </p>
          <InfoRow label={UI.distance} value={`${(station?.distanceKm ?? 1.2).toFixed(1)} km`} />
          <InfoRow
            label={UI.coordinates}
            value={`${(station?.station.lat ?? 52.459).toFixed(4)}, ${(station?.station.lon ?? 4.589).toFixed(4)}`}
          />
          <InfoRow label={UI.height} value="10 m" />
          <InfoRow
            label={UI.dataAge}
            value={live.ageMinutes != null ? `${Math.round(live.ageMinutes)} min` : UI.unknown}
          />
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

/** @deprecated use CurrentConditionsCard */
export const HeroCard = CurrentConditionsCard;
export const StationCompassCard = StationInfoCard;
