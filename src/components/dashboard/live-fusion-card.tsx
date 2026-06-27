"use client";

import { ChevronDown, Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { DirectionLabel } from "@/components/dashboard/wind-display";
import { UI, formatObservationClock } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import { msToKnots } from "@/lib/units/wind";
import { freshnessLevel } from "@/lib/rws/client";
import { cn } from "@/lib/utils";

interface LiveFusionCardProps {
  data: DashboardData;
  onRefresh?: () => void;
  loading?: boolean;
}

function freshnessDot(level: "green" | "orange" | "red") {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        level === "green" && "bg-emerald-500",
        level === "orange" && "bg-amber-500",
        level === "red" && "bg-red-500"
      )}
    />
  );
}

export function LiveFusionCard({ data, onRefresh, loading }: LiveFusionCardProps) {
  const fusion = data.fusion;
  if (!fusion) return null;

  const nearbyCount = fusion.sources.filter((o) => o.included && o.distanceKm <= 15).length;
  const primary =
    fusion.contributors.find((c) => c.included && c.weightPercent === Math.max(...fusion.contributors.filter((x) => x.included).map((x) => x.weightPercent))) ??
    fusion.contributors.find((c) => c.included);
  const freshness = freshnessLevel(fusion.ageMinutes);

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            {UI.liveFusion}
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
              disabled={loading}
              aria-label={UI.refresh}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label={UI.finalWind} value={`${Math.round(msToKnots(fusion.speedMs))} kn`} large />
          <Metric
            label={UI.confidence}
            value={`${fusion.confidence}%`}
            sub={fusion.confidenceLabel}
          />
          <Metric label={UI.nearbySensors} value={String(nearbyCount)} />
          <Metric
            label={UI.freshness}
            value={
              <span className="inline-flex items-center gap-1.5">
                {freshnessDot(freshness)}
                {fusion.ageMinutes != null ? `${fusion.ageMinutes} min` : UI.unknown}
              </span>
            }
          />
          <Metric
            label={UI.primarySource}
            value={primary ? `${primary.providerLabel}: ${primary.name}` : UI.unknown}
            className="col-span-2 sm:col-span-1"
          />
          <Metric label={UI.lastSync} value={formatObservationClock(data.syncedAt)} />
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{UI.confidence}</span>
            <span>{fusion.confidence}%</span>
          </div>
          <Progress value={fusion.confidence} className="h-2" />
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50">
            {UI.whyThisValue}
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <WhyThisValueTable data={data} />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  large,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] uppercase text-muted-foreground truncate">{label}</p>
      <p className={cn("font-bold tabular-nums truncate", large ? "text-2xl" : "text-sm")}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function WhyThisValueTable({ data }: { data: DashboardData }) {
  const rows = data.fusion?.contributors.filter((c) => c.included) ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{UI.noLiveData}</p>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-1.5 pr-2">{UI.provider}</th>
            <th className="py-1.5 pr-2">{UI.station}</th>
            <th className="py-1.5 pr-2 text-right">{UI.weight}</th>
            <th className="py-1.5 text-right">{UI.wind}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.code} className="border-b border-slate-100">
              <td className="py-1.5 pr-2">{c.providerLabel}</td>
              <td className="py-1.5 pr-2 truncate max-w-[120px]">{c.name}</td>
              <td className="py-1.5 pr-2 text-right tabular-nums">{c.weightPercent}%</td>
              <td className="py-1.5 text-right tabular-nums">
                {Math.round(msToKnots(c.speedMs))} kn
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.fusion && (
        <p className="text-[10px] text-muted-foreground mt-2">
          {UI.fusionResult}: {Math.round(msToKnots(data.fusion.speedMs))} kn{" "}
          <DirectionLabel direction={data.fusion.directionDeg} compact />
        </p>
      )}
    </div>
  );
}
