"use client";

import { useCallback, useEffect, useState } from "react";
import { HeroCard, LiveWindCard } from "@/components/dashboard/hero-card";
import { ForecastTimeline, ModelComparisonChart } from "@/components/dashboard/forecast-charts";
import {
  KiteCalculator,
  SafetyDetails,
  StationDetails,
  DataSourcesPanel,
  DebugDrawer,
} from "@/components/dashboard/sections";
import { StickyDecisionBar } from "@/components/dashboard/sticky-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { AlertCircle, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState<RiderWeight>("medium");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?weight=${weight}`, { cache: "no-store" });
      if (!res.ok) throw new Error(UI.loadError);
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : UI.loadError);
    } finally {
      setLoading(false);
    }
  }, [weight]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) return <DashboardSkeleton />;

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{UI.loadError}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchData}>{UI.tryAgain}</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="pb-24 space-y-4">
        <HeroCard data={data} />
        <LiveWindCard data={data} />
        <ForecastTimeline data={data} />
        <ModelComparisonChart data={data} />
        <KiteCalculator data={data} weight={weight} onWeightChange={setWeight} />
        <SafetyDetails data={data} />
        <StationDetails data={data} />
        <DataSourcesPanel data={data} />
        <DebugDrawer data={data} />
      </div>
      <StickyDecisionBar data={data} onRefresh={fetchData} loading={loading} />
    </>
  );
}

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-wind)]/20">
          <Wind className="h-5 w-5 text-[var(--accent-wind)]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight">{UI.appTitle}</h1>
          <p className="text-[11px] text-muted-foreground">{UI.appSubtitle}</p>
        </div>
      </div>
    </header>
  );
}
