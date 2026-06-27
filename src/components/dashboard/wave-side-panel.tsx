"use client";

import { UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { Droplets, Thermometer, Timer, Waves } from "lucide-react";

interface WaveSidePanelProps {
  data: DashboardData;
  waveHeightCm: number;
  wavePeriodS: number | null;
  compact?: boolean;
}

export function WaveSidePanel({ data, waveHeightCm, wavePeriodS, compact }: WaveSidePanelProps) {
  const { water } = data;
  const period = wavePeriodS != null ? `${wavePeriodS.toFixed(1)} s` : UI.unknown;
  const temp = water.waterTempC != null ? `${water.waterTempC.toFixed(1)} °C` : UI.unknown;

  if (compact) {
    return (
      <div className="mt-3 grid grid-cols-2 gap-2 text-center w-full max-w-[220px] mx-auto">
        <Mini label={UI.waveHeight} value={`${waveHeightCm} cm`} />
        <Mini label={UI.waveInterval} value={period} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[220px] mx-auto lg:mx-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 space-y-3">
      <div className="text-center">
        <Waves className="h-8 w-8 text-primary mx-auto mb-2 opacity-80" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{UI.waveHeight}</p>
        <p className="text-4xl sm:text-5xl font-bold tabular-nums text-slate-900 leading-none mt-1">{waveHeightCm}</p>
        <p className="text-sm text-slate-500 mt-0.5">cm</p>
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm">
        <Row icon={Timer} label={UI.waveInterval} value={period} />
        <Row icon={Droplets} label={UI.tide} value={water.tide.label} />
        <Row icon={Thermometer} label={UI.waterTemp} value={temp} />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-2 border border-white">
      <span className="flex items-center gap-1.5 text-slate-500 text-xs min-w-0">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-semibold text-slate-800 tabular-nums text-xs shrink-0">{value}</span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 px-2 py-1.5">
      <p className="text-[9px] uppercase text-slate-400 truncate">{label}</p>
      <p className="text-sm font-bold text-slate-800 tabular-nums">{value}</p>
    </div>
  );
}
