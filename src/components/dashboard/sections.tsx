"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, AlertTriangle } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { UI, WEIGHT_LABELS } from "@/lib/i18n/nl";
import { cn } from "@/lib/utils";

interface KiteCalculatorProps {
  data: DashboardData;
  weight: RiderWeight;
  onWeightChange: (w: RiderWeight) => void;
}

export function KiteCalculator({ data, weight, onWeightChange }: KiteCalculatorProps) {
  const { kite } = data;
  const weights: RiderWeight[] = ["light", "medium", "heavy"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{UI.kiteSize}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {weights.map((w) => (
            <Button
              key={w}
              variant={weight === w ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => onWeightChange(w)}
            >
              {WEIGHT_LABELS[w]}
            </Button>
          ))}
        </div>
        <div className="text-center py-2">
          <p className="text-5xl font-bold">{kite.primary}</p>
          <p className="text-sm text-muted-foreground mt-1">{UI.range} {kite.range}</p>
        </div>
        <p className="text-sm text-muted-foreground">{kite.notes}</p>
      </CardContent>
    </Card>
  );
}

export function SafetyDetails({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);
  const { safety, decision } = data;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{UI.safetyDetails}</CardTitle>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            <p className="text-sm">{safety.windCharacter}</p>
            {decision.warnings.map((w) => (
              <div key={w} className="flex gap-2 text-sm text-amber-200/90">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}
            <div className="space-y-1 pt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{UI.confidenceFactors}</p>
              {decision.confidenceFactors.map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span>{f.label}</span>
                  <span className={f.impact < 0 ? "text-red-400" : "text-muted-foreground"}>
                    {f.impact > 0 ? "+" : ""}{f.impact}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function StationDetails({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">{UI.stationDetails}</CardTitle>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {data.stations.map((s) => (
              <div key={s.station.code} className="rounded-lg bg-muted/30 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.station.name}</span>
                  <Badge variant={s.available ? "default" : "secondary"}>
                    {s.available ? UI.online : UI.offline}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.station.code} · {s.distanceKm.toFixed(1)} km · {s.station.lat.toFixed(4)}, {s.station.lon.toFixed(4)}
                </p>
                {s.latest.speed && (
                  <p className="text-xs mt-1">
                    {s.latest.speed.value.toFixed(1)} m/s
                    {s.ageMinutes != null && ` · ${Math.round(s.ageMinutes)} min geleden`}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function DataSourcesPanel({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);
  const rws = data.bronnen.filter((b) => b.type === "rws");
  const forecast = data.bronnen.filter((b) => b.type === "forecast");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Databronnen</CardTitle>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">RWS live</p>
              {rws.map((s) => (
                <div key={s.id} className="rounded-lg bg-muted/30 p-3 text-sm mb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.ok ? "default" : "secondary"}>{s.ok ? "OK" : "Fout"}</Badge>
                  </div>
                  {s.ok && s.data ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(s.data.speedKt)} kn · {String(s.data.directionDeg)}° · {s.latencyMs}ms
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 mt-1">{s.error ?? "Geen data"}</p>
                  )}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Voorspelling</p>
              {forecast.map((s) => (
                <div key={s.id} className="rounded-lg bg-muted/30 p-3 text-sm mb-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.ok ? "default" : "secondary"}>{s.ok ? "OK" : "Fout"}</Badge>
                  </div>
                  {s.ok && s.data ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {String(s.data.speedKt)} kn · {String(s.data.directionDeg)}° · {String(s.data.points)} punten · {s.latencyMs}ms
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 mt-1">{s.error ?? "Geen data"}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export function DebugDrawer({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-dashed">
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-muted-foreground">{UI.rawDebug}</CardTitle>
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <pre className="text-[10px] overflow-x-auto bg-muted/30 rounded-lg p-3 max-h-64">
              {JSON.stringify({ raw: data.raw, bronnen: data.bronnen }, null, 2)}
            </pre>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
