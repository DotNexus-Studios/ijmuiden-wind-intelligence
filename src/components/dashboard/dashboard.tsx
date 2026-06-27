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
import { StickyDecisionBar } from "@/components/dashboard/sticky-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { UI } from "@/lib/i18n/nl";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AlertCircle, Menu, Sun, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid lg:grid-cols-2 gap-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const [weight, setWeight] = useState<RiderWeight>("medium");
  const { data, loading, polling, error, newMeasurement, refresh } = useDashboardData(weight);

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{UI.loadError}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => refresh()}>{UI.tryAgain}</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="pb-28 space-y-4">
        <div className="grid xl:grid-cols-2 gap-4">
          <CurrentConditionsCard data={data} newMeasurement={newMeasurement} />
          <ForecastOverviewCard data={data} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <WindGustsChart data={data} />
          <ModelComparisonTable data={data} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <ForecastFusedChart data={data} />
          <KiteCalculator data={data} weight={weight} onWeightChange={setWeight} />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <StationInfoCard data={data} />
          <SafetyCheck data={data} />
        </div>

        <details className="group">
          <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 py-2 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">›</span>
            Technische details & debug
          </summary>
          <div className="space-y-3 pt-2">
            <StationDetails data={data} />
            <DataSourcesPanel data={data} />
            <DebugDrawer data={data} />
          </div>
        </details>
      </div>

      <StickyDecisionBar data={data} onRefresh={refresh} loading={loading || polling} />
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
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
              <Waves className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-wide uppercase truncate">{UI.appTitle}</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">{UI.appSubtitle}</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
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
