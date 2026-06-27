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
      <span
        className={cn(
          "font-bold tracking-tight leading-none block max-w-full",
          STATUS_TEXT[status],
          "text-4xl sm:text-7xl lg:text-8xl",
          className
        )}
      >
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
        "inline-flex items-center justify-center font-bold tracking-tight rounded-md border",
        styles[status],
        size === "lg" ? "text-sm px-2.5 py-1" : "text-[10px] px-1.5 py-0.5",
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

export function WindCompass({ direction, size = "md" }: { direction: number; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-36 h-36" : size === "sm" ? "w-12 h-12" : "w-24 h-24";
  const dirs = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
  const idx = Math.round(((direction % 360) + 360) % 360 / 45) % 8;
  const label = dirs[idx];

  return (
    <div className={cn("relative mx-auto flex flex-col items-center", dim)}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r="52" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
        {["N", "O", "Z", "W"].map((d, i) => {
          const angle = i * 90 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 60 + Math.cos(rad) * 46;
          const y = 60 + Math.sin(rad) * 46;
          return (
            <text
              key={d}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-400 text-[9px] font-bold"
            >
              {d}
            </text>
          );
        })}
        <g transform={`rotate(${direction} 60 60)`}>
          <polygon points="60,18 55,62 60,56 65,62" fill="#2563eb" />
        </g>
        <circle cx="60" cy="60" r="5" fill="#2563eb" />
      </svg>
      {size === "lg" && (
        <p className="text-center mt-1">
          <span className="text-lg font-bold text-slate-800">{label}</span>
          <span className="text-sm text-slate-500 ml-2">{Math.round(direction)}°</span>
        </p>
      )}
    </div>
  );
}

export function DirectionLabel({ direction, compact }: { direction: number; compact?: boolean }) {
  const dirs = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO", "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(((direction % 360) + 360) % 360 / 22.5) % 16;
  if (compact) {
    return (
      <span className="text-sm font-semibold text-slate-800">
        {dirs[idx]} {Math.round(direction)}°
      </span>
    );
  }
  return (
    <span className="font-semibold text-slate-800">
      {dirs[idx]} <span className="text-muted-foreground font-normal">{Math.round(direction)}°</span>
    </span>
  );
}

export function DirectionArrow({ degrees }: { degrees: number }) {
  return (
    <span
      className="inline-block text-primary font-bold"
      style={{ transform: `rotate(${degrees}deg)` }}
      aria-hidden
    >
      ↑
    </span>
  );
}
