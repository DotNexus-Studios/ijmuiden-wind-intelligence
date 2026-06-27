"use client";

import { CurrentConditionsCard, StationInfoCard } from "@/components/dashboard/hero-card";
import {
  ForecastOverviewCard,
  ModelComparisonTable,
  WindGustsChart,
  ForecastFusedChart,
} from "@/components/dashboard/forecast-charts";
import {
  KiteCalculator,
  SafetyCheck,
  StationDetails,
  DataSourcesPanel,
  DebugDrawer,
} from "@/components/dashboard/sections";
import { SurfConditionsCard } from "@/components/dashboard/surf-card";
import { StickyDecisionBar } from "@/components/dashboard/sticky-bar";
import { LoadingBanner } from "@/components/dashboard/loading-banner";
import {
  ChartCardSkeleton,
  ForecastOverviewSkeleton,
  HeroCardSkeleton,
  KiteCalculatorSkeleton,
  SafetyCheckSkeleton,
  StationInfoSkeleton,
  SurfCardSkeleton,
  StickyBarSkeleton,
  TableCardSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { UI } from "@/lib/i18n/nl";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AlertCircle, Menu, Sun, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const [weight, setWeight] = useState<RiderWeight>("medium");
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

      <div className="pb-28 space-y-4 min-w-0 max-w-full">
        <div className="grid xl:grid-cols-2 gap-4 min-w-0">
          {data ? (
            <CurrentConditionsCard data={data} newMeasurement={newMeasurement} loadingLive={loading} />
          ) : (
            <HeroCardSkeleton />
          )}
          {hasForecast && data ? (
            <ForecastOverviewCard data={data} />
          ) : (
            <ForecastOverviewSkeleton />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 min-w-0">
          {hasForecast && data ? (
            <WindGustsChart data={data} />
          ) : (
            <ChartCardSkeleton title={UI.windGusts} />
          )}
          {hasForecast && data ? (
            <ForecastFusedChart data={data} />
          ) : (
            <ChartCardSkeleton title={UI.forecastFused} />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 min-w-0">
          {hasForecast && data ? (
            <ModelComparisonTable data={data} />
          ) : (
            <TableCardSkeleton />
          )}
          {data ? (
            <SurfConditionsCard data={data} />
          ) : (
            <SurfCardSkeleton />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 min-w-0">
          {data ? (
            <SafetyCheck data={data} />
          ) : (
            <SafetyCheckSkeleton />
          )}
          {data ? (
            <KiteCalculator data={data} weight={weight} onWeightChange={setWeight} />
          ) : (
            <KiteCalculatorSkeleton />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 min-w-0">
          {data ? (
            <StationInfoCard data={data} loadingLive={loading} />
          ) : (
            <StationInfoSkeleton />
          )}
        </div>

        {data && (
          <details className="group min-w-0">
            <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 py-2 list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">›</span>
              Technische details & debug
            </summary>
            <div className="space-y-3 pt-2 min-w-0">
              <StationDetails data={data} />
              <DataSourcesPanel />
              <DebugDrawer data={data} />
            </div>
          </details>
        )}
      </div>

      {data ? (
        <StickyDecisionBar data={data} onRefresh={refresh} loading={loading || polling} />
      ) : (
        <StickyBarSkeleton />
      )}
    </>
  );
}

const NAV = [
  { id: "dashboard", label: UI.navDashboard, active: true },
  { id: "forecast", label: UI.navForecast, active: false },
  { id: "tools", label: UI.navTools, active: false },
  { id: "stations", label: UI.navStations, active: false },
];

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

          <nav className="hidden md:flex items-center gap-1 shrink-0">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  item.active
                    ? "text-primary bg-blue-50"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-50"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Thema">
              <Sun className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" aria-label="Menu">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
