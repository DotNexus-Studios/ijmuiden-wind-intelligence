"use client";

import { CurrentConditionsCard } from "@/components/dashboard/hero-card";
import {
  ForecastOverviewCard,
  ForecastFusedChart,
  WindGustsChart,
} from "@/components/dashboard/forecast-charts";
import { StickyDecisionBar } from "@/components/dashboard/sticky-bar";
import { LoadingBanner } from "@/components/dashboard/loading-banner";
import { SportSwitcher } from "@/components/dashboard/sport-switcher";
import { useSport } from "@/components/dashboard/sport-context";
import {
  ChartCardSkeleton,
  ForecastOverviewSkeleton,
  HeroCardSkeleton,
  StickyBarSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { UI } from "@/lib/i18n/nl";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AlertCircle, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NavMenu } from "@/components/dashboard/nav-menu";
import { useState } from "react";

export function Dashboard() {
  const [weight, setWeight] = useState<RiderWeight>("medium");
  const { sport, setSport } = useSport();
  const { data, phase, loading, polling, error, newMeasurement, refresh } = useDashboardData(weight);

  if (phase === "error" && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{UI.loadError}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => refresh()}>{UI.tryAgain}</Button>
      </div>
    );
  }

  const hasForecast = data?.forecast.points.length;

  return (
    <>
      <LoadingBanner phase={phase} className="mb-4" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <SportSwitcher value={sport} onChange={setSport} />
        <Link
          href="/intelligence"
          className="text-xs font-semibold text-primary hover:underline shrink-0"
        >
          {UI.dataIntelligence} →
        </Link>
      </div>

      <div className="pb-24 space-y-4 min-w-0 max-w-full">
        <div className="grid xl:grid-cols-2 gap-4 min-w-0">
          {data ? (
            <CurrentConditionsCard
              data={data}
              sport={sport}
              riderWeight={weight}
              onWeightChange={setWeight}
              newMeasurement={newMeasurement}
              loadingLive={loading}
            />
          ) : (
            <HeroCardSkeleton />
          )}
          {hasForecast && data ? (
            <ForecastOverviewCard data={data} sport={sport} />
          ) : (
            <ForecastOverviewSkeleton />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 min-w-0">
          {hasForecast && data ? (
            <WindGustsChart data={data} sport={sport} />
          ) : (
            <ChartCardSkeleton title={UI.windGusts} />
          )}
          {hasForecast && data ? (
            <ForecastFusedChart data={data} sport={sport} />
          ) : (
            <ChartCardSkeleton title={UI.forecastFused} />
          )}
        </div>
      </div>

      {data ? (
        <StickyDecisionBar
          data={data}
          sport={sport}
          riderWeight={weight}
          onRefresh={refresh}
          loading={loading || polling}
        />
      ) : (
        <StickyBarSkeleton />
      )}
    </>
  );
}

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 min-w-0">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-wide uppercase truncate">{UI.appTitle}</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block truncate">{UI.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NavMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
