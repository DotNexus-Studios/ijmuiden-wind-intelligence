"use client";

import { SectionHeader } from "@/components/dashboard/section-header";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { Droplets, Thermometer, Timer, Waves } from "lucide-react";

export function WaterInfoCard({ data }: { data: DashboardData }) {
  const { water } = data;

  return (
    <section className="dashboard-card p-5 sm:p-6 min-w-0 max-w-full">
      <SectionHeader title={UI.waterInfo} />
      <p className="text-sm text-slate-500 -mt-2 mb-4">{water.source}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric
          icon={Droplets}
          label={UI.tide}
          value={water.tide.label}
          sub={water.tide.nextEventTime && water.tide.nextEventLabel
            ? `${water.tide.nextEventLabel} ${formatObservationClock(water.tide.nextEventTime)}`
            : water.tide.description}
        />
        <Metric
          icon={Thermometer}
          label={UI.waterTemp}
          value={water.waterTempC != null ? `${water.waterTempC.toFixed(1)} °C` : UI.unknown}
        />
        <Metric
          icon={Timer}
          label={UI.waveInterval}
          value={water.wavePeriodS != null ? `${water.wavePeriodS.toFixed(1)} s` : UI.unknown}
        />
        <Metric
          icon={Waves}
          label={UI.waveHeight}
          value={water.waveHeightCm != null ? `${water.waveHeightCm} cm` : UI.unknown}
        />
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Droplets;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">{label}</p>
      </div>
      <p className="text-sm font-bold text-slate-900 leading-snug">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{sub}</p>}
    </div>
  );
}
