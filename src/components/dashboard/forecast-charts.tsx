"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from "recharts";
import { StatusBadge } from "@/components/dashboard/wind-display";
import { msToKnots } from "@/lib/units/wind";
import { UI, formatTimelineLabel } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { assessSafety } from "@/lib/watersport/safety";
import Link from "next/link";

const MODEL_COLORS: Record<string, string> = {
  harmonie: "#2563eb",
  icon: "#7c3aed",
  ecmwf: "#059669",
  gfs: "#d97706",
  fused: "#0f172a",
};

export function ForecastTimeline({ data }: { data: DashboardData }) {
  const items = data.forecast.timeline;

  return (
    <section className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {UI.forecastTimeline}
        </h2>
        <Link href="#modellen" className="text-xs text-primary font-medium hover:underline">
          {UI.moreDetail}
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
        {items.map((point) => {
          const status = assessSafety({
            windSpeedMs: point.speedMs,
            gustMs: point.gustMs,
            directionDeg: point.directionDeg,
            trend: "stable",
            confidence: point.confidence,
          }).status;

          return (
            <div
              key={point.label}
              className="flex-shrink-0 snap-start min-w-[92px] rounded-xl bg-slate-50 border border-border p-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {formatTimelineLabel(point.label)}
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1 text-slate-900">
                {Math.round(msToKnots(point.speedMs))}
              </p>
              <p className="text-[10px] text-muted-foreground">kn · vl {Math.round(msToKnots(point.gustMs))}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{Math.round(point.directionDeg)}° · {Math.round(point.confidence)}%</p>
              <div className="mt-2 flex justify-center">
                <StatusBadge status={status} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function WindGustsChart({ data }: { data: DashboardData }) {
  const chartData = data.forecast.points.slice(0, 12).map((p) => ({
    time: new Date(p.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
    wind: Math.round(msToKnots(p.speedMs)),
    gust: Math.round(msToKnots(p.gustMs)),
  }));

  return (
    <section className="dashboard-card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        {UI.windGusts}
      </h2>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit=" kn" width={32} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }} />
            <Area type="monotone" dataKey="gust" fill="#dbeafe" stroke="none" name="Vlagen" />
            <Line type="monotone" dataKey="wind" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Wind" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ModelComparisonChart({ data }: { data: DashboardData }) {
  const { models, points } = data.forecast;
  const now = points[0];

  return (
    <section id="modellen" className="dashboard-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {UI.modelComparison}
        </h2>
        <span className="text-xs text-muted-foreground">
          {UI.updated} {new Date(data.syncedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="pb-2 font-medium">Model</th>
              <th className="pb-2 font-medium">Wind</th>
              <th className="pb-2 font-medium">Vlagen</th>
              <th className="pb-2 font-medium">Richting</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => {
              const pt = m.points.find((p) => p.time === now?.time) ?? m.points[0];
              return (
                <tr key={m.model} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 font-medium">{m.modelLabel}</td>
                  <td className="py-2.5 tabular-nums">{Math.round(msToKnots(pt.speedMs))} kn</td>
                  <td className="py-2.5 tabular-nums">{Math.round(msToKnots(pt.gustMs ?? pt.speedMs * 1.25))} kn</td>
                  <td className="py-2.5 tabular-nums">{Math.round(pt.directionDeg)}°</td>
                </tr>
              );
            })}
            {now && (
              <tr className="bg-blue-50/60 font-semibold">
                <td className="py-2.5">{UI.fused}</td>
                <td className="py-2.5">{Math.round(msToKnots(now.speedMs))} kn</td>
                <td className="py-2.5">{Math.round(msToKnots(now.gustMs))} kn</td>
                <td className="py-2.5">{Math.round(now.directionDeg)}°</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-40 mt-4 hidden sm:block">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points.slice(0, 12).map((fused) => {
            const row: Record<string, string | number> = {
              time: new Date(fused.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
              fused: Math.round(msToKnots(fused.speedMs)),
            };
            for (const model of models) {
              const pt = model.points.find((p) => p.time === fused.time);
              if (pt) row[model.model] = Math.round(msToKnots(pt.speedMs));
            }
            return row;
          })}>
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} unit=" kn" width={32} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="fused" stroke={MODEL_COLORS.fused} strokeWidth={2.5} dot={false} name={UI.fused} />
            {models.map((m) => (
              <Line key={m.model} type="monotone" dataKey={m.model} stroke={MODEL_COLORS[m.model]} strokeWidth={1.5} dot={false} name={m.modelLabel} strokeDasharray={m.model === "gfs" ? "4 4" : undefined} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
