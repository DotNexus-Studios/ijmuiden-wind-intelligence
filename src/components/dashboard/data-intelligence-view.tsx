"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LiveFusionCard } from "@/components/dashboard/live-fusion-card";
import { SensorNetworkCard } from "@/components/dashboard/sensor-network-card";
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
  FusionTransparencyCard,
  DebugDrawer,
} from "@/components/dashboard/sections";
import { SurfConditionsCard } from "@/components/dashboard/surf-card";
import { WaterInfoCard } from "@/components/dashboard/water-info-card";
import { StationInfoCard } from "@/components/dashboard/hero-card";
import { SportSwitcher } from "@/components/dashboard/sport-switcher";
import { useSport } from "@/components/dashboard/sport-context";
import { UI } from "@/lib/i18n/nl";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import type { DashboardData } from "@/lib/dashboard";

interface DataIntelligenceViewProps {
  data: DashboardData;
  riderWeight: RiderWeight;
  onWeightChange: (w: RiderWeight) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function DataIntelligenceView({
  data,
  riderWeight,
  onWeightChange,
  onRefresh,
  loading,
}: DataIntelligenceViewProps) {
  const { sport, setSport } = useSport();

  return (
    <div className="space-y-4 min-w-0 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 -ml-2 px-2 py-1 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          {UI.backToDashboard}
        </Link>
        <SportSwitcher value={sport} onChange={setSport} />
      </div>

      <p className="text-sm text-slate-600">{UI.dataIntelligenceIntro}</p>

      <FusionTransparencyCard data={data} />

      <div className="grid lg:grid-cols-2 gap-4 min-w-0">
        {data.fusion ? (
          <LiveFusionCard data={data} onRefresh={onRefresh} loading={loading} />
        ) : null}
        {data.fusion ? <SensorNetworkCard data={data} /> : null}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 min-w-0">
        <ForecastOverviewCard data={data} sport={sport} />
        <WindGustsChart data={data} sport={sport} />
      </div>

      <ForecastFusedChart data={data} sport={sport} />

      <ModelComparisonTable data={data} />

      <div className="grid lg:grid-cols-2 gap-4 min-w-0">
        <SafetyCheck data={data} />
        <KiteCalculator data={data} weight={riderWeight} onWeightChange={onWeightChange} />
      </div>

      <WaterInfoCard data={data} />

      <div className="grid lg:grid-cols-2 gap-4 min-w-0">
        <SurfConditionsCard data={data} />
        <StationInfoCard data={data} loadingLive={loading} />
      </div>

      <StationDetails data={data} />
      <DataSourcesPanel />
      <DebugDrawer data={data} />
    </div>
  );
}
