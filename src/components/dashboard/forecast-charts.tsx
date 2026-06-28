"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
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
import { getTimelineEffectiveHeightM, getTimelineWaveHeightCm } from "@/lib/marine/wave-display";
import {
  assessForecastPointForSport,
  getSportWindGoRange,
  isGoStatus,
  toDisplayStatus,
  type SportId,
} from "@/lib/watersport/sports";

const HOUR_SLICES: Record<string, number> = { "12H": 12, "24H": 24, "3D": 72, "5D": 120 };

function goDotColor(isGo: boolean, isWait: boolean): string {
  if (isGo) return "#16a34a";
  if (isWait) return "#d97706";
  return "#94a3b8";
}

interface ChartSportProps {
  data: DashboardData;
  sport: SportId;
}

function findSurfPointAtTime(
  data: DashboardData,
  time: string
): { effectiveHeightM: number; wavePeriodS: number } | null {
  const match = data.surf.timeline.find(
    (t) => Math.abs(new Date(t.time).getTime() - new Date(time).getTime()) < 3_600_000
  );
  if (!match) return null;
  return {
    effectiveHeightM: getTimelineEffectiveHeightM(match),
    wavePeriodS: match.wavePeriodS,
  };
}

export function ForecastOverviewCard({ data, sport }: ChartSportProps) {
  const items = useMemo(() => {
    const timeline = data.forecast.timeline;
    const tomorrow = data.forecast.points.find((p) => {
      const d = new Date(p.time);
      const now = new Date();
      return d.getDate() !== now.getDate() && d.getHours() >= 10 && d.getHours() <= 14;
    });
    const mapped = timeline.map((point) => {
      const status = assessForecastPointForSport(sport, point, data.surf.timeline);
      return {
        ...point,
        displayLabel: formatTimelineLabel(point.label),
        status,
        displayStatus: toDisplayStatus(status),
      };
    });
    if (tomorrow && !mapped.some((m) => m.displayLabel === UI.tomorrow)) {
      const status = assessForecastPointForSport(sport, tomorrow, data.surf.timeline);
      mapped.push({
        ...tomorrow,
        label: UI.tomorrow,
        displayLabel: UI.tomorrow.toUpperCase(),
        status,
        displayStatus: toDisplayStatus(status),
      });
    }
    return mapped;
  }, [data.forecast, data.surf.timeline, sport]);

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full min-w-0 max-w-full overflow-hidden">
      <SectionHeader
        title={UI.forecastOverview}
        action={
          <Link href="/intelligence#modellen" className="text-xs font-semibold text-primary hover:underline shrink-0">
            {UI.moreDetail}
          </Link>
        }
      />
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
        <div className="flex gap-2 w-max max-w-none pb-1">
          {items.map((point) => {
            const go = isGoStatus(point.status);
            const surfPoint = sport !== "kite" && sport !== "wingfoil"
              ? findSurfPointAtTime(data, point.time)
              : null;
            const waveCm = surfPoint ? Math.round(surfPoint.effectiveHeightM * 100) : 0;
            const wavePeriod = surfPoint?.wavePeriodS;

            return (
              <div
                key={`${point.displayLabel}-${point.time}`}
                className={`w-[88px] shrink-0 rounded-xl border p-3 text-center ${
                  go ? "border-emerald-200 bg-emerald-50/80" : "border-slate-100 bg-slate-50/80"
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {point.displayLabel}
                </p>
                <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                  {sport === "surf"
                    ? waveCm
                    : Math.round(msToKnots(point.speedMs))}
                </p>
                <p className="text-[10px] text-slate-500">
                  {sport === "surf" ? "cm" : "kt"}
                </p>
                {sport === "surf" && wavePeriod != null && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {wavePeriod.toFixed(1)} s
                  </p>
                )}
                {sport === "windsurf" && (
                  <>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Gust {Math.round(msToKnots(point.gustMs))}
                    </p>
                    <p className="text-[10px] text-indigo-600 font-medium">
                      {waveCm} cm · {wavePeriod?.toFixed(1) ?? "?"} s
                    </p>
                  </>
                )}
                {sport !== "surf" && sport !== "windsurf" && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Gust {Math.round(msToKnots(point.gustMs))}
                  </p>
                )}
                {sport !== "surf" && (
                  <div className="flex justify-center my-1">
                    <DirectionArrow degrees={point.directionDeg} />
                  </div>
                )}
                <p className="text-[10px] text-slate-400">{Math.round(point.confidence)}%</p>
                <div className="mt-2 flex justify-center">
                  <StatusBadge status={point.displayStatus} size="sm" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function WindGustsChart({ data, sport }: ChartSportProps) {
  const [range, setRange] = useState("12H");
  const hours = HOUR_SLICES[range] ?? 12;
  const goRange = getSportWindGoRange(sport);
  const showWaveOverlay = sport === "windsurf";

  const chartData = data.forecast.points.slice(0, hours).map((p, i) => {
    const status = assessForecastPointForSport(sport, p, data.surf.timeline);
    const wind = Math.round(msToKnots(p.speedMs));
    const gust = Math.round(msToKnots(p.gustMs));
    const surfPoint = findSurfPointAtTime(data, p.time);
    return {
      time: new Date(p.time).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
      wind,
      gust,
      wave: surfPoint ? Math.round(surfPoint.effectiveHeightM * 100) : null,
      isNow: i === 0,
      isGo: isGoStatus(status),
      isWait: status === "WAIT" || status === "FLAT",
    };
  });

  return (
    <section className="dashboard-card p-5 sm:p-6 min-w-0 max-w-full overflow-hidden">
      <SectionHeader
        title={showWaveOverlay ? `${UI.windGusts} & ${UI.waveHeight.toLowerCase()}` : UI.windGusts}
        action={<TimeRangeToggle options={["12H", "24H", "3D"]} value={range} onChange={setRange} />}
      />
      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            {sport !== "surf" && (
              <ReferenceArea
                y1={goRange.minKn}
                y2={goRange.maxKn}
                fill="#dcfce7"
                fillOpacity={0.55}
                label={{
                  value: UI.goZone,
                  position: "insideTopLeft",
                  fill: "#16a34a",
                  fontSize: 10,
                }}
              />
            )}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
            <YAxis yAxisId="wind" tick={{ fontSize: 10, fill: "#94a3b8" }} unit=" kt" width={34} />
            {showWaveOverlay && (
              <YAxis
                yAxisId="wave"
                orientation="right"
                tick={{ fontSize: 10, fill: "#6366f1" }}
                unit=" cm"
                width={34}
              />
            )}
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            <Area yAxisId="wind" type="monotone" dataKey="gust" fill="#dbeafe" stroke="#93c5fd" strokeWidth={1} name="Vlagen" />
            <Line
              yAxisId="wind"
              type="monotone"
              dataKey="wind"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={goDotColor(payload.isGo, payload.isWait)}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              }}
              name="Wind"
            />
            {showWaveOverlay && (
              <Line
                yAxisId="wave"
                type="monotone"
                dataKey="wave"
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                dot={false}
                name="Golf (cm)"
                connectNulls
              />
            )}
            {chartData[0] && (
              <ReferenceLine
                x={chartData[0].time}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "NU", position: "top", fill: "#64748b", fontSize: 10 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function ForecastFusedChart({ data, sport }: ChartSportProps) {
  const [range, setRange] = useState("24H");
  const hours = HOUR_SLICES[range] ?? 24;
  const goRange = getSportWindGoRange(sport);

  const surfChartData = data.surf.timeline.slice(0, hours).map((p) => ({
    time: new Date(p.time).toLocaleDateString("nl-NL", { weekday: "short", hour: "2-digit" }),
    wave: getTimelineWaveHeightCm(p),
    isGo: p.status === "GO",
    isWait: p.status === "WAIT" || p.status === "FLAT",
  }));

  const windChartData = data.forecast.points.slice(0, hours).map((p) => {
    const status = assessForecastPointForSport(sport, p, data.surf.timeline);
    return {
      time: new Date(p.time).toLocaleDateString("nl-NL", { weekday: "short", hour: "2-digit" }),
      wind: Math.round(msToKnots(p.speedMs)),
      gust: Math.round(msToKnots(p.gustMs)),
      isGo: isGoStatus(status),
      isWait: status === "WAIT" || status === "FLAT",
    };
  });

  const chartData = sport === "surf" ? surfChartData : windChartData;
  const windsurfChartData =
    sport === "windsurf"
      ? data.forecast.points.slice(0, hours).map((p) => {
          const status = assessForecastPointForSport(sport, p, data.surf.timeline);
          const surfPoint = findSurfPointAtTime(data, p.time);
          return {
            time: new Date(p.time).toLocaleDateString("nl-NL", { weekday: "short", hour: "2-digit" }),
            wind: Math.round(msToKnots(p.speedMs)),
            gust: Math.round(msToKnots(p.gustMs)),
            wave: surfPoint ? Math.round(surfPoint.effectiveHeightM * 100) : null,
            isGo: isGoStatus(status),
            isWait: status === "WAIT" || status === "FLAT",
          };
        })
      : null;

  const activeChartData = sport === "windsurf" ? windsurfChartData! : chartData;

  return (
    <section className="dashboard-card p-5 sm:p-6 min-w-0 max-w-full overflow-hidden">
      <SectionHeader
        title={
          sport === "surf"
            ? UI.surfForecast48h
            : sport === "windsurf"
              ? `${UI.forecastFused} & ${UI.waveHeight.toLowerCase()}`
              : UI.forecastFused
        }
        action={<TimeRangeToggle options={["24H", "3D", "5D"]} value={range} onChange={setRange} />}
      />
      <div className="h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeChartData as Array<Record<string, unknown>>}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            {sport === "surf" ? (
              <ReferenceArea y1={70} y2={250} fill="#dcfce7" fillOpacity={0.5} label={{ value: UI.goZone, position: "insideTopLeft", fill: "#16a34a", fontSize: 10 }} />
            ) : (
              <ReferenceArea y1={goRange.minKn} y2={goRange.maxKn} fill="#dcfce7" fillOpacity={0.55} label={{ value: UI.goZone, position: "insideTopLeft", fill: "#16a34a", fontSize: 10 }} />
            )}
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
            {sport === "windsurf" ? (
              <>
                <YAxis yAxisId="wind" tick={{ fontSize: 10, fill: "#94a3b8" }} unit=" kt" width={38} />
                <YAxis yAxisId="wave" orientation="right" tick={{ fontSize: 10, fill: "#6366f1" }} unit=" cm" width={38} />
              </>
            ) : (
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                unit={sport === "surf" ? " cm" : " kt"}
                width={38}
              />
            )}
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
            {sport === "surf" ? (
              <Area type="monotone" dataKey="wave" fill="#e0e7ff" stroke="#6366f1" strokeWidth={2} name="Golf (cm)" dot={(props) => {
                const { cx, cy, payload } = props;
                if (cx == null || cy == null) return null;
                return (
                  <circle cx={cx} cy={cy} r={3} fill={goDotColor(payload.isGo, payload.isWait)} stroke="#fff" strokeWidth={1} />
                );
              }} />
            ) : sport === "windsurf" ? (
              <>
                <Area yAxisId="wind" type="monotone" dataKey="gust" fill="#e0e7ff" stroke="none" name="Vlagen" />
                <Line
                  yAxisId="wind"
                  type="monotone"
                  dataKey="wind"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null) return null;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={goDotColor(payload.isGo, payload.isWait)}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                  name="Wind"
                />
                <Line
                  yAxisId="wave"
                  type="monotone"
                  dataKey="wave"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  name="Golf (cm)"
                  connectNulls
                />
              </>
            ) : (
              <>
                <Area type="monotone" dataKey="gust" fill="#e0e7ff" stroke="none" name="Vlagen" />
                <Line
                  type="monotone"
                  dataKey="wind"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null) return null;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={goDotColor(payload.isGo, payload.isWait)}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }}
                  name="Wind"
                />
              </>
            )}
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
  const fusedKt = data.live.formatted.knots;

  const rows = models.map((m) => {
    const pt = m.points.find((p) => p.time === now?.time) ?? m.points[0];
    const speedKt = Math.round(msToKnots(pt.speedMs));
    const error =
      fusedKt > 0
        ? Math.round((speedKt - fusedKt) * 10) / 10
        : m.errorTracking?.h6 ?? 0;
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
    <section id="modellen" className="dashboard-card p-5 sm:p-6 min-w-0 max-w-full overflow-hidden">
      <SectionHeader
        title={UI.modelComparison}
        action={
          <span className="text-[11px] text-slate-400 shrink-0">
            {UI.updated}: {formatObservationClock(data.syncedAt)}
          </span>
        }
      />
      <p className="text-xs text-slate-500 -mt-2 mb-3">
        {UI.modelErrorHint} ({fusedKt} kn ±{data.live.margin.marginKt} kt)
      </p>
      <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="pb-2 font-semibold pr-2">Model</th>
              <th className="pb-2 font-semibold pr-2">Wind (kt)</th>
              <th className="pb-2 font-semibold pr-2">Vlagen (kt)</th>
              <th className="pb-2 font-semibold pr-2">Richt.</th>
              <th className="pb-2 font-semibold pr-2">{UI.errorVsFused}</th>
              <th className="pb-2 font-semibold pr-2">Gewicht</th>
              <th className="pb-2 font-semibold">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-50 text-slate-700">
                <td className="py-2.5 font-semibold text-slate-800 pr-2">{row.name}</td>
                <td className="py-2.5 tabular-nums pr-2">{row.speedKt}</td>
                <td className="py-2.5 tabular-nums pr-2">{row.gustKt}</td>
                <td className="py-2.5 pr-2">
                  <DirectionArrow degrees={row.direction} />
                </td>
                <td
                  className={`py-2.5 tabular-nums pr-2 ${Number(row.error) > 0 ? "text-amber-600" : "text-emerald-600"}`}
                >
                  {Number(row.error) > 0 ? "+" : ""}
                  {row.error}
                </td>
                <td className="py-2.5 tabular-nums pr-2">{row.weight}%</td>
                <td className="py-2.5 tabular-nums">{row.conf}%</td>
              </tr>
            ))}
            {now && (
              <tr className="bg-blue-50/70 font-bold text-slate-900">
                <td className="py-2.5 pr-2">{UI.fusedForecast}</td>
                <td className="py-2.5">{Math.round(msToKnots(now.speedMs))}</td>
                <td className="py-2.5">{Math.round(msToKnots(now.gustMs))}</td>
                <td className="py-2.5">
                  <DirectionArrow degrees={Math.round(now.directionDeg)} />
                </td>
                <td className="py-2.5">±{data.live.margin.marginKt}</td>
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

export const ForecastTimeline = ForecastOverviewCard;
export const ModelComparisonChart = ModelComparisonTable;
