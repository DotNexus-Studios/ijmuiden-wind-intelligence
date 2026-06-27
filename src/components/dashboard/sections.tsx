"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SectionHeader } from "@/components/dashboard/section-header";
import { StatusBadge } from "@/components/dashboard/wind-display";
import { ChevronDown, Check, AlertTriangle } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import type { SourceCheckResult } from "@/lib/sources";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { UI, WEIGHT_LABELS } from "@/lib/i18n/nl";
import { cn } from "@/lib/utils";

interface KiteCalculatorProps {
  data: DashboardData;
  weight: RiderWeight;
  onWeightChange: (w: RiderWeight) => void;
}

const SELECT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30";

export function KiteCalculator({ data, weight, onWeightChange }: KiteCalculatorProps) {
  const { kite } = data;
  const [level, setLevel] = useState("intermediate");
  const [board, setBoard] = useState("twintip");
  const [kiteType, setKiteType] = useState("inflatable");
  const [water, setWater] = useState("sea");

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full min-w-0 max-w-full">
      <SectionHeader title={UI.kiteSize} />
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <Field label="Gewicht">
          <select
            className={SELECT_CLASS}
            value={weight}
            onChange={(e) => onWeightChange(e.target.value as RiderWeight)}
          >
            <option value="light">{WEIGHT_LABELS.light} (65 kg)</option>
            <option value="medium">{WEIGHT_LABELS.medium} (80 kg)</option>
            <option value="heavy">{WEIGHT_LABELS.heavy} (95 kg)</option>
          </select>
        </Field>
        <Field label="Niveau">
          <select className={SELECT_CLASS} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Gevorderd</option>
            <option value="expert">Expert</option>
          </select>
        </Field>
        <Field label="Board">
          <select className={SELECT_CLASS} value={board} onChange={(e) => setBoard(e.target.value)}>
            <option value="twintip">Twintip</option>
            <option value="surfboard">Surfboard</option>
            <option value="foil">Foil</option>
          </select>
        </Field>
        <Field label="Kite type">
          <select className={SELECT_CLASS} value={kiteType} onChange={(e) => setKiteType(e.target.value)}>
            <option value="inflatable">Tube / inflatable</option>
            <option value="foil">Foil kite</option>
            <option value="c-kite">C-kite</option>
          </select>
        </Field>
        <Field label="Water" className="sm:col-span-2">
          <select className={SELECT_CLASS} value={water} onChange={(e) => setWater(e.target.value)}>
            <option value="sea">Zee / kust</option>
            <option value="lake">Meer</option>
            <option value="lagoon">Lagune</option>
          </select>
        </Field>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-100 p-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">Aanbevolen</p>
        <p className="text-5xl font-bold text-slate-900 tabular-nums">{kite.primary}</p>
        <p className="text-sm text-slate-600 mt-1">
          {UI.range}: {kite.range}
        </p>
      </div>
      <p className="text-sm text-slate-500 mt-3 leading-relaxed">{kite.notes}</p>
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

const SAFETY_CHECKS = [
  { key: "wind", label: "Wind binnen veilig bereik (10-28 kn)" },
  { key: "gust", label: "Vlagen acceptabel t.o.v. gemiddelde wind" },
  { key: "direction", label: "Richting geschikt voor kust (side-onshore)" },
  { key: "confidence", label: "Voldoende betrouwbaarheid in data" },
] as const;

export function SafetyCheck({ data }: { data: DashboardData }) {
  const { safety, decision, live } = data;
  const isSafe = decision.status === "GO";

  const checks = {
    wind: live.formatted.knots >= 10 && live.formatted.knots <= 28,
    gust: live.gustMs <= live.speedMs * 1.5,
    direction: live.directionDeg >= 225 || live.directionDeg <= 45 || (live.directionDeg >= 135 && live.directionDeg <= 315),
    confidence: decision.confidence >= 50,
  };

  return (
    <section className="dashboard-card p-5 sm:p-6 h-full min-w-0 max-w-full">
      <SectionHeader title={UI.safetyDetails} />
      <div
        className={cn(
          "rounded-xl border p-4 mb-4 text-center",
          isSafe
            ? "bg-emerald-50 border-emerald-200"
            : decision.status === "WAIT"
              ? "bg-amber-50 border-amber-200"
              : "bg-red-50 border-red-200"
        )}
      >
        <StatusBadge status={decision.status} size="lg" />
        <p className="text-sm font-semibold mt-2 text-slate-800">
          {isSafe ? UI.safeToGo : decision.status === "WAIT" ? "Wacht op betere condities" : "Niet veilig om te gaan"}
        </p>
      </div>

      <ul className="space-y-2.5">
        {SAFETY_CHECKS.map((item) => {
          const ok = checks[item.key as keyof typeof checks];
          return (
            <li key={item.key} className="flex items-start gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className={ok ? "text-slate-700" : "text-slate-400"}>{item.label}</span>
            </li>
          );
        })}
      </ul>

      {decision.warnings.length > 0 && (
        <div className="mt-4 space-y-2">
          {decision.warnings.map((w) => (
            <div key={w} className="flex gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">{safety.windCharacter}</p>
    </section>
  );
}

/** @deprecated use SafetyCheck */
export const SafetyDetails = SafetyCheck;

export function StationDetails({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="dashboard-card overflow-hidden">
        <CollapsibleTrigger className="w-full text-left px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{UI.stationDetails}</span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-3">
            {data.stations.map((s) => (
              <div key={s.station.code} className="rounded-lg bg-slate-50 p-3 text-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{s.station.name}</span>
                  <Badge variant={s.available ? "default" : "secondary"}>
                    {s.available ? UI.online : UI.offline}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {s.station.code} · {s.distanceKm.toFixed(1)} km · {s.station.lat.toFixed(4)}, {s.station.lon.toFixed(4)}
                </p>
                {s.latest.speed && (
                  <p className="text-xs mt-1 text-slate-600">
                    {s.latest.speed.value.toFixed(1)} m/s
                    {s.ageMinutes != null && ` · ${Math.round(s.ageMinutes)} min geleden`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function DataSourcesPanel() {
  const [open, setOpen] = useState(false);
  const [bronnen, setBronnen] = useState<SourceCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/bronnen", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json.sources ?? json.summary?.rws ?? []) as SourceCheckResult[];
        if (Array.isArray(json.sources)) {
          setBronnen(json.sources);
        } else if (json.summary) {
          setBronnen([...(json.summary.rws ?? []), ...(json.summary.voorspelling ?? [])]);
        } else {
          setBronnen(list);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setBronnen([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  const rws = bronnen.filter((b) => b.type === "rws");
  const forecast = bronnen.filter((b) => b.type === "forecast");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="dashboard-card overflow-hidden">
        <CollapsibleTrigger className="w-full text-left px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Databronnen</span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-4 min-w-0">
            {loading && (
              <p className="text-sm text-slate-500 animate-pulse">Databronnen controleren...</p>
            )}
            {!loading && (
              <>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">RWS live</p>
              {rws.map((s) => (
                <div key={s.id} className="rounded-lg bg-slate-50 p-3 text-sm mb-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.ok ? "default" : "secondary"}>{s.ok ? "OK" : "Fout"}</Badge>
                  </div>
                  {s.ok && s.data ? (
                    <p className="text-xs text-slate-500 mt-1">
                      {String(s.data.speedKt)} kn · {String(s.data.directionDeg)}° · {s.latencyMs}ms
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-1">{s.error ?? "Geen data"}</p>
                  )}
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">Voorspelling</p>
              {forecast.map((s) => (
                <div key={s.id} className="rounded-lg bg-slate-50 p-3 text-sm mb-2 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.ok ? "default" : "secondary"}>{s.ok ? "OK" : "Fout"}</Badge>
                  </div>
                  {s.ok && s.data ? (
                    <p className="text-xs text-slate-500 mt-1">
                      {String(s.data.speedKt)} kn · {String(s.data.directionDeg)}° · {String(s.data.points)} punten · {s.latencyMs}ms
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-1">{s.error ?? "Geen data"}</p>
                  )}
                </div>
              ))}
            </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function DebugDrawer({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="dashboard-card border-dashed overflow-hidden">
        <CollapsibleTrigger className="w-full text-left px-5 py-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">{UI.rawDebug}</span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-5 pb-5">
            <pre className="text-[10px] overflow-x-auto bg-slate-50 rounded-lg p-3 max-h-64 border border-slate-100">
              {JSON.stringify({ raw: data.raw, bronnen: data.bronnen }, null, 2)}
            </pre>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
