"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/dashboard/section-header";
import {
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
  loadingLive?: boolean;
}

export function CurrentConditionsCard({ data, newMeasurement, loadingLive }: HeroCardProps) {
  const { decision, live } = data;
  const gustKt = Math.round(msToKnots(live.gustMs));
  const obsTime = data.observationTimestamp;
  const stationName = live.sourceLabel ?? live.station?.station.name ?? "IJGeul, 1";
  const awaitingLive = loadingLive || data.preview;

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full min-w-0 max-w-full">
      <SectionHeader
        title={UI.currentConditions}
        action={
          <div className="flex items-center gap-2 shrink-0">
            {awaitingLive && !obsTime ? (
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-[10px] animate-pulse">
                {UI.loadingLive}
              </Badge>
            ) : (
              <LiveBadge />
            )}
            {newMeasurement && (
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px]">
                {UI.newMeasurement}
              </Badge>
            )}
          </div>
        }
      />

      <p className="text-sm text-slate-500 -mt-2 mb-4 truncate">
        {awaitingLive && !obsTime
          ? UI.loadingPreview
          : live.combinedSources
            ? `${UI.combinedSources}: ${stationName}`
            : stationName}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] items-start min-w-0">
        <div className="min-w-0 order-2 lg:order-1">
          <StatusBadge status={decision.status} size="hero" />
          <div className="mt-5 max-w-sm w-full">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-slate-500 font-medium">{UI.confidence}</span>
              {awaitingLive && !obsTime ? (
                <Skeleton className="h-4 w-10" />
              ) : (
                <span className="font-bold text-emerald-600">{decision.confidence}%</span>
              )}
            </div>
            <Progress value={decision.confidence} className="h-2.5 bg-slate-100 [&>div]:bg-emerald-500" />
          </div>
          <p className="text-sm text-slate-600 mt-4 leading-relaxed break-words">
            {decision.explanation.split(".").slice(0, 2).join(".")}.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6 min-w-0">
            <MetricBlock label={UI.wind} value={`${live.formatted.knots} kt`} sub={`(${Math.round(live.formatted.ms * 3.6)} km/u)`} loading={awaitingLive && !obsTime} />
            <MetricBlock label={UI.gusts} value={`${gustKt} kt`} sub={`(${Math.round(live.gustMs * 3.6)} km/u)`} loading={awaitingLive && !obsTime} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">{UI.trend}</p>
              <TrendArrow trend={live.trend} />
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 w-full max-w-[220px] mx-auto lg:mx-0 lg:max-w-none shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2 text-center lg:text-left">
            {UI.windRose}
          </p>
          {awaitingLive && !obsTime ? (
            <Skeleton className="w-44 h-44 sm:w-52 sm:h-52 rounded-full mx-auto" />
          ) : (
            <WindCompass direction={live.directionDeg} size="xl" showZones prominent />
          )}
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

function MetricBlock({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5 truncate">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16 mt-1" />
      ) : (
        <p className="text-xl sm:text-2xl font-bold tabular-nums text-slate-900 leading-none truncate">{value}</p>
      )}
      {sub && !loading && <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>}
    </div>
  );
}

export function StationInfoCard({ data, loadingLive }: HeroCardProps) {
  const { live } = data;
  const station = live.station;
  const awaitingLive = loadingLive || data.preview;

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full min-w-0 max-w-full">
      <SectionHeader title={UI.stationInfo} />
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center min-w-0">
        {awaitingLive && !data.observationTimestamp ? (
          <Skeleton className="w-40 h-40 rounded-full mx-auto shrink-0" />
        ) : (
          <WindCompass direction={live.directionDeg} size="lg" showZones />
        )}
        <div className="space-y-2.5 text-sm min-w-0">
          <p className="font-semibold text-slate-800 truncate">
            {awaitingLive && !station ? UI.loadingLive : `${station?.station.name ?? "IJGeul, 1"} (RWS)`}
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
