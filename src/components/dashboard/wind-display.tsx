"use client";

import { cn } from "@/lib/utils";
import type { GoStatus } from "@/lib/watersport/safety";

const STATUS_STYLES: Record<GoStatus, string> = {
  GO: "bg-[var(--status-go)] text-[#042015]",
  WAIT: "bg-[var(--status-wait)] text-[#2a1f00]",
  "EXPERT ONLY": "bg-[var(--status-expert)] text-white",
  "NO GO": "bg-[var(--status-nogo)] text-white",
};

interface StatusBadgeProps {
  status: GoStatus;
  size?: "sm" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "lg", className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold tracking-tight rounded-xl",
        STATUS_STYLES[status],
        size === "lg" ? "text-2xl sm:text-3xl px-4 py-2" : "text-xs px-2 py-0.5 rounded-md",
        className
      )}
    >
      {status}
    </span>
  );
}

export function FreshnessDot({ level }: { level: "green" | "orange" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    orange: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  };
  return (
    <span
      className={cn("inline-block w-2.5 h-2.5 rounded-full", colors[level])}
      title={`Data freshness: ${level}`}
    />
  );
}

export function TrendArrow({ trend }: { trend: "rising" | "stable" | "dropping" }) {
  const icons = { rising: "↑", stable: "→", dropping: "↓" };
  const labels = { rising: "Rising", stable: "Stable", dropping: "Dropping" };
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium">
      <span className="text-lg">{icons[trend]}</span>
      {labels[trend]}
    </span>
  );
}

export function WindCompass({ direction }: { direction: number }) {
  return (
    <div className="relative w-20 h-20 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
        {["N", "E", "S", "W"].map((label, i) => {
          const angle = i * 90 - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + Math.cos(rad) * 38;
          const y = 50 + Math.sin(rad) * 38;
          return (
            <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px] font-medium">
              {label}
            </text>
          );
        })}
        <g transform={`rotate(${direction} 50 50)`}>
          <polygon points="50,12 44,55 50,48 56,55" fill="var(--accent-wind)" />
        </g>
        <circle cx="50" cy="50" r="4" fill="var(--accent-wind)" />
      </svg>
      <p className="text-center text-xs text-muted-foreground mt-1">{Math.round(direction)}°</p>
    </div>
  );
}
