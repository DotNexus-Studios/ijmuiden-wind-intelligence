"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Badge } from "@/components/ui/badge";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { getDisplayWaveHeightCm, getTimelineWaveHeightCm } from "@/lib/marine/wave-display";
import type { SurfStatus } from "@/lib/watersport/surf";
import { cn } from "@/lib/utils";

const SURF_STATUS_STYLE: Record<SurfStatus, string> = {
  GO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  WAIT: "bg-amber-50 text-amber-700 border-amber-200",
  "NO GO": "bg-red-50 text-red-700 border-red-200",
  FLAT: "bg-slate-100 text-slate-600 border-slate-200",
};

export function SurfConditionsCard({ data }: { data: DashboardData }) {
  const surf = data.surf;

  const chartData = useMemo(
    () =>
      surf.timeline.slice(0, 48).map((p) => ({
        time: new Date(p.time).toLocaleTimeString("nl-NL", {
          weekday: "short",
          hour: "2-digit",
        }),
        heightCm: getTimelineWaveHeightCm(p),
        period: Math.round(p.wavePeriodS * 10) / 10,
        status: p.status,
      })),
    [surf.timeline]
  );

  const heightCm = getDisplayWaveHeightCm(data);
  const swellCm = Math.round(surf.now.swellHeightM * 100);

  return (
    <section className="dashboard-card p-5 sm:p-6 min-w-0 max-w-full overflow-hidden h-full">
      <SectionHeader
        title={UI.surfConditions}
        action={
          <SurfStatusBadge status={surf.status} />
        }
      />

      <p className="text-sm text-slate-500 -mt-2 mb-4">{UI.surfSpot}</p>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-5 items-start min-w-0">
        <div className="min-w-0">
          <p className="text-lg font-bold text-slate-900 leading-snug">{surf.headline}</p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{surf.explanation}</p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Metric label={UI.waveHeight} value={`${heightCm} cm`} />
            <Metric label={UI.wavePeriod} value={`${surf.now.wavePeriodS.toFixed(1)} s`} />
            <Metric label={UI.swell} value={`${swellCm} cm`} />
          </div>

          {surf.bestWindow && surf.status !== "GO" && (
            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm">
              <p className="font-semibold text-blue-800">{UI.surfBestWindow}</p>
              <p className="text-blue-700 text-xs mt-1">
                {formatWindow(surf.bestWindow.start, surf.bestWindow.end)}
                {" · "}
                {Math.round(surf.bestWindow.peakHeightM * 100)} cm,{" "}
                {surf.bestWindow.peakPeriodS.toFixed(1)} s
              </p>
            </div>
          )}

          {surf.warnings.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {surf.warnings.map((w) => (
                <li key={w} className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
                  {w}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
            {UI.surfForecast48h}
          </p>
          <div className="h-44 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
                <YAxis
                  tick={{ fontSize: 9, fill: "#94a3b8" }}
                  unit=" cm"
                  width={32}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 11 }}
                  formatter={(value, name) => [
                    name === "heightCm" ? `${value} cm` : `${value} s`,
                    name === "heightCm" ? "Golven" : "Periode",
                  ]}
                />
                <ReferenceLine y={50} stroke="#93c5fd" strokeDasharray="4 4" label={{ value: "50cm", fontSize: 9, fill: "#64748b" }} />
                <ReferenceLine y={100} stroke="#2563eb" strokeDasharray="4 4" label={{ value: "1m", fontSize: 9, fill: "#2563eb" }} />
                <Area type="monotone" dataKey="heightCm" fill="#dbeafe" stroke="#93c5fd" strokeWidth={1.5} name="heightCm" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{UI.surfThresholdHint}</p>
        </div>
      </div>
    </section>
  );
}

function SurfStatusBadge({ status }: { status: SurfStatus }) {
  return (
    <Badge variant="outline" className={cn("font-bold text-[10px] uppercase", SURF_STATUS_STYLE[status])}>
      {UI.surfStatus[status]}
    </Badge>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">{label}</p>
      <p className="text-lg font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function formatWindow(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  const t1 = formatObservationClock(start);
  const t2 = formatObservationClock(end);
  if (start === end) return `${day} ${t1}`;
  return `${day} ${t1} - ${t2}`;
}
