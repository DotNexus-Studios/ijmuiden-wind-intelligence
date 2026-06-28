"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, TREND_LABELS, UI } from "@/lib/i18n/nl";
import type { GoStatus } from "@/lib/watersport/safety";
import { useAnimatedDegrees } from "@/hooks/use-animated-degrees";
import {
  classifyWindDirectionQuality,
  compassPoint,
  isOffshoreWind,
  normalizeWindFromDeg,
  windToDeg,
} from "@/lib/units/wind";

const STATUS_TEXT: Record<GoStatus, string> = {
  GO: "status-go-text",
  WAIT: "status-wait-text",
  "NO GO": "status-nogo-text",
  "EXPERT ONLY": "status-expert-text",
};

interface StatusBadgeProps {
  status: GoStatus;
  size?: "sm" | "lg" | "hero";
  className?: string;
  label?: string;
}

export function StatusBadge({ status, size = "lg", className, label }: StatusBadgeProps) {
  const text = label ?? STATUS_LABELS[status];

  if (size === "hero") {
    return (
      <span
        className={cn(
          "font-bold tracking-tight leading-none block max-w-full",
          STATUS_TEXT[status],
          label === UI.pumpCall ? "text-3xl sm:text-6xl lg:text-7xl" : "text-4xl sm:text-7xl lg:text-8xl",
          className
        )}
      >
        {text}
      </span>
    );
  }

  const styles: Record<GoStatus, string> = {
    GO: "bg-emerald-50 text-emerald-700 border-emerald-200",
    WAIT: "bg-amber-50 text-amber-700 border-amber-200",
    "EXPERT ONLY": "bg-orange-50 text-orange-700 border-orange-200",
    "NO GO": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold tracking-tight rounded-md border",
        styles[status],
        size === "lg" ? "text-sm px-2.5 py-1" : "text-[10px] px-1.5 py-0.5",
        className
      )}
    >
      {text}
    </span>
  );
}

export function FreshnessDot({ level }: { level: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full", colors[level])} />;
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
}

export function TrendArrow({ trend }: { trend: "rising" | "stable" | "dropping" }) {
  const icons = { rising: "↗", stable: "→", dropping: "↘" };
  const colors = {
    rising: "text-emerald-600",
    stable: "text-emerald-600",
    dropping: "text-amber-600",
  };
  const labels = {
    rising: TREND_LABELS.rising,
    stable: TREND_LABELS.stable,
    dropping: TREND_LABELS.dropping,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", colors[trend])}>
      <span>{icons[trend]}</span>
      {labels[trend]}
    </span>
  );
}

const COMPASS_LABELS = [
  { label: "N", deg: 0 },
  { label: "NO", deg: 45 },
  { label: "O", deg: 90 },
  { label: "ZO", deg: 135 },
  { label: "Z", deg: 180 },
  { label: "ZW", deg: 225 },
  { label: "W", deg: 270 },
  { label: "NW", deg: 315 },
] as const;

const DIRECTION_LABELS = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];

function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = compassPoint(cx, cy, r, startDeg);
  const end = compassPoint(cx, cy, r, endDeg);
  const span = ((endDeg - startDeg + 360) % 360) || 360;
  const largeArc = span > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

interface WindCompassProps {
  /** Meteorologische richting: waar de wind vandaan komt */
  direction: number;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showZones?: boolean;
  prominent?: boolean;
  animated?: boolean;
  className?: string;
}

export function WindCompass({
  direction,
  size = "md",
  showZones = false,
  prominent = false,
  animated = false,
  className,
}: WindCompassProps) {
  const markerId = useId().replace(/:/g, "");
  const targetFrom = normalizeWindFromDeg(direction);
  const targetTo = windToDeg(targetFrom);
  const animFrom = useAnimatedDegrees(targetFrom, animated ? 900 : 0);
  const animTo = useAnimatedDegrees(targetTo, animated ? 900 : 0);
  const fromDeg = animated ? animFrom : targetFrom;
  const toDeg = animated ? animTo : targetTo;
  const quality = classifyWindDirectionQuality(fromDeg);
  const offshore = isOffshoreWind(fromDeg);

  const dims = {
    sm: "w-14 h-14",
    md: "w-24 h-24",
    lg: "w-40 h-40",
    xl: "w-44 h-44 sm:w-52 sm:h-52",
    "2xl": "w-52 h-52 sm:w-60 sm:h-60 lg:w-72 lg:h-72",
  }[size];

  const labelSize =
    size === "sm" ? "text-[7px]" : size === "md" ? "text-[8px]" : size === "2xl" ? "text-[11px]" : "text-[10px]";
  const rim = size === "sm" ? 34 : size === "md" ? 38 : size === "2xl" ? 48 : 46;
  const arrowRim = size === "sm" ? 28 : size === "md" ? 32 : size === "2xl" ? 44 : 40;
  const strokeW = size === "sm" ? 2.5 : prominent || size === "2xl" ? 4.5 : 3.5;

  const fromPt = compassPoint(60, 60, arrowRim, fromDeg);
  const toPt = compassPoint(60, 60, arrowRim, toDeg);
  const fromIdx = Math.round(fromDeg / 22.5) % 16;
  const toIdx = Math.round(toDeg / 22.5) % 16;
  const fromLabel = DIRECTION_LABELS[fromIdx];
  const toLabel = DIRECTION_LABELS[toIdx];

  const qualityColors = {
    offshore: { sector: "fill-red-100/80", arrow: "#dc2626" },
    onshore: { sector: "fill-amber-100/60", arrow: "#2563eb" },
    "side-onshore": { sector: "fill-emerald-100/80", arrow: "#2563eb" },
    "side-shore": { sector: "fill-sky-100/60", arrow: "#2563eb" },
  }[quality];

  return (
    <div className={cn("relative mx-auto flex flex-col items-center min-w-0", dims, className)}>
      <svg
        viewBox="0 0 120 120"
        className={cn("w-full h-full", animated ? "drop-shadow-md" : "drop-shadow-sm")}
        role="img"
        aria-label={`${UI.windFrom} ${fromLabel}, ${UI.windTo} ${toLabel}`}
      >
        <defs>
          <linearGradient id={`wind-compass-bg-${markerId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#eff6ff" />
          </linearGradient>
          <marker id={`wind-arrowhead-${markerId}`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <polygon points="0 0, 8 4, 0 8" fill={qualityColors.arrow} />
          </marker>
        </defs>

        <circle cx="60" cy="60" r="54" fill={`url(#wind-compass-bg-${markerId})`} className="stroke-slate-200/80" strokeWidth="1.5" />

        {animated && (
          <g className="wind-compass-orbit">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#93c5fd" strokeWidth="1" strokeDasharray="4 6" opacity="0.45" />
          </g>
        )}

        <circle cx="60" cy="60" r="52" fill="none" className="stroke-slate-200" strokeWidth="2" />

        {(showZones || prominent) && (
          <>
            <path d={sectorPath(60, 60, 50, 45, 135)} className="fill-red-100/70 transition-opacity duration-500" />
            <path d={sectorPath(60, 60, 50, 225, 315)} className="fill-emerald-100/70 transition-opacity duration-500" />
          </>
        )}

        <circle cx="60" cy="60" r="42" fill="none" className="stroke-slate-200/80" strokeWidth="1" strokeDasharray="3 4" />

        {COMPASS_LABELS.map(({ label, deg }) => {
          const pt = compassPoint(60, 60, rim, deg);
          const isActive = label === fromLabel || label === toLabel;
          return (
            <text
              key={label}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn(
                labelSize,
                "font-bold transition-all duration-500",
                isActive ? "fill-primary" : "fill-slate-400"
              )}
            >
              {label}
            </text>
          );
        })}

        <circle cx={fromPt.x} cy={fromPt.y} r={size === "sm" ? 2.5 : size === "2xl" ? 5 : 4} fill={qualityColors.arrow} opacity={0.45} />

        <line
          x1={fromPt.x}
          y1={fromPt.y}
          x2={toPt.x}
          y2={toPt.y}
          stroke={qualityColors.arrow}
          strokeWidth={strokeW}
          strokeLinecap="round"
          markerEnd={`url(#wind-arrowhead-${markerId})`}
          className={animated ? "wind-compass-arrow" : undefined}
          style={{ transition: animated ? "x1 0.9s cubic-bezier(0.22,1,0.36,1), y1 0.9s cubic-bezier(0.22,1,0.36,1), x2 0.9s cubic-bezier(0.22,1,0.36,1), y2 0.9s cubic-bezier(0.22,1,0.36,1)" : undefined }}
        />

        <circle
          cx="60"
          cy="60"
          r={size === "sm" ? 3 : size === "2xl" ? 6 : 5}
          fill={qualityColors.arrow}
          className={animated ? "wind-compass-center" : undefined}
        />
      </svg>

      {(size === "lg" || size === "xl" || size === "2xl" || prominent) && (
        <div className="text-center mt-3 min-w-0 w-full px-1">
          <p className={cn("font-bold text-slate-800", size === "2xl" ? "text-base sm:text-lg" : "text-sm sm:text-base")}>
            {UI.windFrom} {fromLabel}
            <span className="text-slate-400 font-normal mx-1">→</span>
            {toLabel}
          </p>
          <p className="text-xs text-slate-500 tabular-nums mt-0.5">
            {Math.round(fromDeg)}° · {UI.windTo} {Math.round(toDeg)}°
          </p>
        </div>
      )}

      {prominent && offshore && (
        <div className="mt-2 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide">{UI.offshoreWind}</p>
          <p className="text-[11px] text-red-600 mt-0.5">{UI.offshoreHint}</p>
        </div>
      )}

      {prominent && !offshore && quality === "side-onshore" && (
        <p className="mt-2 text-xs font-semibold text-emerald-700">{UI.sideOnshoreWind}</p>
      )}
    </div>
  );
}

export function DirectionLabel({ direction, compact }: { direction: number; compact?: boolean }) {
  const dirs = DIRECTION_LABELS;
  const idx = Math.round(normalizeWindFromDeg(direction) / 22.5) % 16;
  if (compact) {
    return (
      <span className="text-sm font-semibold text-slate-800">
        {dirs[idx]} {Math.round(direction)}°
      </span>
    );
  }
  return (
    <span className="font-semibold text-slate-800">
      {dirs[idx]}{" "}
      <span className="text-muted-foreground font-normal">
        {Math.round(direction)}° ({UI.windFrom})
      </span>
    </span>
  );
}

/** Pijl in blaasrichting (waar wind naartoe waait) */
export function DirectionArrow({ degrees }: { degrees: number }) {
  return (
    <span
      className="inline-block text-primary font-bold"
      style={{ transform: `rotate(${windToDeg(degrees)}deg)` }}
      aria-hidden
      title={`${UI.windTo} ${DIRECTION_LABELS[Math.round(windToDeg(degrees) / 22.5) % 16]}`}
    >
      ↑
    </span>
  );
}
