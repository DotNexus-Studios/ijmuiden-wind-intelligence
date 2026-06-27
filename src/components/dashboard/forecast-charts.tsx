"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionHeader } from "@/components/dashboard/section-header";
import { TimeRangeToggle } from "@/components/dashboard/time-range-toggle";
import { DirectionArrow, StatusBadge } from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import { UI, formatObservationClock, formatTimelineLabel } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { assessSafety } from "@/lib/watersport/safety";

const HOUR_SLICES: Record<string, number> = { "12H": 12, "24H": 24, "3D": 72, "5D": 120 };

export function ForecastOverviewCard({ data }: { data: DashboardData }) {
  const items = useMemo(() => {
    const timeline = data.forecast.timeline;
    const tomorrow = data.forecast.points.find((p) => {
      const d = new Date(p.time);
      const now = new Date();
      return d.getDate() !== now.getDate() && d.getHours() >= 10 && d.getHours() <= 14;
    });
    const mapped = timeline.map((point) => ({
      ...point,
      displayLabel: formatTimelineLabel(point.label),
      status: assessSafety({
        windSpeedMs: point.speedMs,
        gustMs: point.gustMs,
        directionDeg: point.directionDeg,
        trend: "stable",
        confidence: point.confidence,
      }).status,
    }));
    if (tomorrow && !mapped.some((m) => m.displayLabel === UI.tomorrow)) {
      mapped.push({
        ...tomorrow,
        label: UI.tomorrow,
        displayLabel: UI.tomorrow.toUpperCase(),
        status: assessSafety({
          windSpeedMs: tomorrow.speedMs,
          gustMs: tomorrow.gustMs,
          directionDeg: tomorrow.directionDeg,
          trend: "stable",
          confidence: tomorrow.confidence,
        }).status,
      });
    }
    return mapped;
  }, [data.forecast]);

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full">
      <SectionHeader
        title={UI.forecastOverview}
        action={
          <Link href="#modellen" className="text-xs font-semibold text-primary hover:underline">
            {UI.moreDetail}
          </Link>
        }
      />
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-flow-col auto-cols-[minmax(88px,1fr)] gap-2 min-w-max">
          {items.map((point) => (
            <div
              key={`${point.displayLabel}-${point.time}`}
              className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {point.displayLabel}
              </p>
              <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                {Math.round(msToKnots(point.speedMs))}
              </p>
              <p className="text-[10px] text-slate-500">kt</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Gust {Math.round(msToKnots(point.gustMs))}
              </p>
              <div className="flex justify-center my-1">
                <DirectionArrow degrees={point.directionDeg} />
              </div>
              <p className="text-[10px] text-slate-400">{Math.round(point.confidence)}%</p>
              <div className="mt-2 flex justify-center">
                <StatusBadge status={point.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WindGustsChart({ data }: { data: DashboardData }) {
  const [range, setRange] = useState("12H");
  const hours = HOUR_SLICES[range] ?? 12;

  const chartData = data.forecast.points.slice(0, hours).map((p, i) => ({
    time: new Date(p.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
    wind: Math.round(msToKnots(p.speedMs)),
    gust: Math.round(msToKnots(p.gustMs)),
    isNow: i === 0,
  }));

  return (
    <section className="dashboard-card p-5 sm:p-6">
      <SectionHeader title={UI.windGusts} action={<TimeRangeToggle options={["12H", "24H", "3D"]} value={range} onChange={setRange} />} />
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit=" kt" width={34} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="gust" fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} name="Vlagen" />
            <Line type="monotone" dataKey="wind" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Wind" />
            {chartData[0] && (
              <ReferenceLine x={chartData[0].time} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "NU", position: "top", fill: "#64748b", fontSize: 10 }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ForecastFusedChart({ data }: { data: DashboardData }) {
  const [range, setRange] = useState("24H");
  const hours = HOUR_SLICES[range] ?? 24;

  const chartData = data.forecast.points.slice(0, hours).map((p) => ({
    time: new Date(p.time).toLocaleDateString("nl-NL", { weekday: "short", hour: "2-digit" }),
    wind: Math.round(msToKnots(p.speedMs)),
    gust: Math.round(msToKnots(p.gustMs)),
  }));

  return (
    <section className="dashboard-card p-5 sm:p-6">
      <SectionHeader title={UI.forecastFused} action={<TimeRangeToggle options={["24H", "3D", "5D"]} value={range} onChange={setRange} />} />
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit=" kt" width={34} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="gust" fill="#e0e7ff" stroke="none" name="Vlagen" />
            <Line type="monotone" dataKey="wind" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Wind" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ModelComparisonTable({ data }: { data: DashboardData }) {
  const { models, points, timeline } = data.forecast;
  const now = points[0];
  const fusedNow = timeline[0];
  const liveKt = data.live.formatted.knots;

  const rows = models.map((m) => {
    const pt = m.points.find((p) => p.time === now?.time) ?? m.points[0];
    const speedKt = Math.round(msToKnots(pt.speedMs));
    const error = liveKt > 0 ? speedKt - liveKt : m.errorTracking?.h6 ?? 0;
    const weight = fusedNow?.weights[m.model] ?? 0;
    return {
      id: m.model,
      name: m.modelLabel.replace("KNMI ", "").replace(" IFS", ""),
      speedKt,
      gustKt: Math.round(msToKnots(pt.gustMs ?? pt.speedMs * 1.25)),
      direction: Math.round(pt.directionDeg),
      error: typeof error === "number" ? error.toFixed(1) : "0.0",
      weight,
      conf: Math.max(20, Math.round(100 - Math.abs(Number(error)) * 8)),
    };
  });

  return (
    <section id="modellen" className="dashboard-card p-5 sm:p-6">
      <SectionHeader
        title={UI.modelComparison}
        action={
          <span className="text-[11px] text-slate-400">
            {UI.updated}: {formatObservationClock(data.syncedAt)}
          </span>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold">Model</th>
              <th className="pb-2 font-semibold">Wind (kt)</th>
              <th className="pb-2 font-semibold">Vlagen (kt)</th>
              <th className="pb-2 font-semibold">Richt.</th>
              <th className="pb-2 font-semibold">Fout vs RWS</th>
              <th className="pb-2 font-semibold">Gewicht</th>
              <th className="pb-2 font-semibold">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 text-slate-700">
                <td className="py-2.5 font-semibold text-slate-800">{row.name}</td>
                <td className="py-2.5 tabular-nums">{row.speedKt}</td>
                <td className="py-2.5 tabular-nums">{row.gustKt}</td>
                <td className="py-2.5">
                  <DirectionArrow degrees={row.direction} />
                </td>
                <td className={`py-2.5 tabular-nums ${Number(row.error) > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                  {Number(row.error) > 0 ? "+" : ""}{row.error}
                </td>
                <td className="py-2.5 tabular-nums">{row.weight}%</td>
                <td className="py-2.5 tabular-nums">{row.conf}%</td>
              </tr>
            ))}
            {now && (
              <tr className="bg-blue-50/70 font-bold text-slate-900">
                <td className="py-2.5">{UI.fusedForecast}</td>
                <td className="py-2.5">{Math.round(msToKnots(now.speedMs))}</td>
                <td className="py-2.5">{Math.round(msToKnots(now.gustMs))}</td>
                <td className="py-2.5"><DirectionArrow degrees={Math.round(now.directionDeg)} /></td>
                <td className="py-2.5">-</td>
                <td className="py-2.5">100%</td>
                <td className="py-2.5">{Math.round(fusedNow?.confidence ?? 0)}%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Legacy exports */
export const ForecastTimeline = ForecastOverviewCard;
export const ModelComparisonChart = ModelComparisonTable;
