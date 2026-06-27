"use client";

import { cn } from "@/lib/utils";
import { STATUS_LABELS, TREND_LABELS } from "@/lib/i18n/nl";
import type { GoStatus } from "@/lib/watersport/safety";

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
}

export function StatusBadge({ status, size = "lg", className }: StatusBadgeProps) {
  if (size === "hero") {
    return (
      <span className={cn("font-bold tracking-tight leading-none", STATUS_TEXT[status], "text-6xl sm:text-7xl", className)}>
        {STATUS_LABELS[status]}
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
        "inline-flex items-center justify-center font-bold tracking-tight rounded-lg border",
        styles[status],
        size === "lg" ? "text-xl px-3 py-1.5" : "text-xs px-2 py-0.5",
        className
      )}
    >
      {STATUS_LABELS[status]}
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
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
}

export function TrendArrow({ trend }: { trend: "rising" | "stable" | "dropping" }) {
  const icons = { rising: "↗", stable: "→", dropping: "↘" };
  const colors = { rising: "text-emerald-600", stable: "text-slate-600", dropping: "text-amber-600" };
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", colors[trend])}>
      <span className="text-base">{icons[trend]}</span>
      {TREND_LABELS[trend]}
    </span>
  );
}

export function WindCompass({ direction, size = "md" }: { direction: number; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-32 h-32" : size === "sm" ? "w-14 h-14" : "w-20 h-20";
  return (
    <div className={cn("relative mx-auto", dim)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="44" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        {["N", "O", "Z", "W"].map((label, i) => {
          const angle = i * 90 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 36;
          const y = 50 + Math.sin(rad) * 36;
          return (
            <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-[9px] font-semibold">
              {label}
            </text>
          );
        })}
        <g transform={`rotate(${direction} 50 50)`}>
          <polygon points="50,14 46,54 50,48 54,54" fill="#2563eb" />
        </g>
        <circle cx="50" cy="50" r="4" fill="#2563eb" />
      </svg>
    </div>
  );
}

export function DirectionLabel({ direction }: { direction: number }) {
  const dirs = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(((direction % 360) + 360) % 360 / 22.5) % 16;
  return (
    <span className="font-semibold text-slate-800">
      {dirs[idx]} <span className="text-muted-foreground font-normal">{Math.round(direction)}°</span>
    </span>
  );
}
