"use client";

import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UI } from "@/lib/i18n/nl";
import type { DashboardData } from "@/lib/dashboard";
import type { ScoredObservation } from "@/lib/fusion/types";
import { msToKnots } from "@/lib/units/wind";
import { cn } from "@/lib/utils";

interface SensorNetworkCardProps {
  data: DashboardData;
}

function statusIndicator(obs: ScoredObservation): "green" | "orange" | "red" {
  if (!obs.included) return "red";
  if (obs.sensorHealth >= 0.8 && obs.consistencyScore >= 0.8) return "green";
  if (obs.sensorHealth >= 0.4 && obs.consistencyScore >= 0.4) return "orange";
  return "red";
}

function StatusDot({ level }: { level: "green" | "orange" | "red" }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full shrink-0",
        level === "green" && "bg-emerald-500",
        level === "orange" && "bg-amber-500",
        level === "red" && "bg-red-500"
      )}
      aria-hidden
    />
  );
}

function healthPercent(obs: ScoredObservation): number {
  return Math.round(obs.sensorHealth * obs.consistencyScore * 100);
}

export function SensorNetworkCard({ data }: SensorNetworkCardProps) {
  const rows = data.fusion?.sources ?? [];
  if (rows.length === 0) return null;

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          {UI.sensorNetwork}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b bg-slate-50/80">
                <th className="py-2 px-3">{UI.provider}</th>
                <th className="py-2 px-3">{UI.station}</th>
                <th className="py-2 px-3 text-right">{UI.distance}</th>
                <th className="py-2 px-3 text-right">{UI.dataAge}</th>
                <th className="py-2 px-3 text-right">{UI.wind}</th>
                <th className="py-2 px-3 text-right">{UI.weight}</th>
                <th className="py-2 px-3 text-right">{UI.health}</th>
                <th className="py-2 px-3 text-center">{UI.status}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((obs) => {
                const status = statusIndicator(obs);
                return (
                  <tr
                    key={obs.id}
                    className={cn("border-b border-slate-100", !obs.included && "opacity-50")}
                  >
                    <td className="py-2 px-3 font-medium">{obs.providerLabel}</td>
                    <td className="py-2 px-3 max-w-[140px] truncate">{obs.stationName}</td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {obs.distanceKm.toFixed(1)} km
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {obs.ageMinutes ?? "-"} min
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {Math.round(msToKnots(obs.speedMs))} kn
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">
                      {obs.included ? `${obs.weightPercent}%` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right tabular-nums">{healthPercent(obs)}%</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center">
                        <StatusDot level={status} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
