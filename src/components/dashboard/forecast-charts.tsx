"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { msToKnots } from "@/lib/units/wind";
import type { DashboardData } from "@/lib/dashboard";

const MODEL_COLORS: Record<string, string> = {
  harmonie: "#38bdf8",
  icon: "#a78bfa",
  ecmwf: "#34d399",
  gfs: "#fb923c",
  fused: "#f8fafc",
};

export function ForecastTimeline({ data }: { data: DashboardData }) {
  const items = data.forecast.timeline;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Forecast timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
          {items.map((point) => (
            <div
              key={point.label}
              className="flex-shrink-0 snap-start min-w-[88px] rounded-xl bg-muted/40 p-3 text-center"
            >
              <p className="text-xs text-muted-foreground">{point.label}</p>
              <p className="text-2xl font-bold tabular-nums mt-1">
                {Math.round(msToKnots(point.speedMs))}
              </p>
              <p className="text-xs text-muted-foreground">kt</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {Math.round(point.directionDeg)}° · {Math.round(point.confidence)}%
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelComparisonChart({ data }: { data: DashboardData }) {
  const { models, points } = data.forecast;

  const chartData = points.slice(0, 24).map((fused) => {
    const row: Record<string, string | number> = {
      time: new Date(fused.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
      fused: Math.round(msToKnots(fused.speedMs) * 10) / 10,
    };
    for (const model of models) {
      const pt = model.points.find((p) => p.time === fused.time);
      if (pt) row[model.model] = Math.round(msToKnots(pt.speedMs) * 10) / 10;
    }
    return row;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Model comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2">
          <div className="min-w-[480px] h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} unit=" kt" width={36} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="fused" stroke={MODEL_COLORS.fused} strokeWidth={2.5} dot={false} name="Fused" />
                {models.map((m) => (
                  <Line
                    key={m.model}
                    type="monotone"
                    dataKey={m.model}
                    stroke={MODEL_COLORS[m.model]}
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray={m.model === "gfs" ? "4 4" : undefined}
                    name={m.modelLabel}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
