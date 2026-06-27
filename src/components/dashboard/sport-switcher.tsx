"use client";

import { cn } from "@/lib/utils";
import { SPORT_LABELS, type SportId } from "@/lib/watersport/sports";
import { Wind, Waves, Zap } from "lucide-react";

const SPORTS: Array<{ id: SportId; icon: typeof Wind }> = [
  { id: "kite", icon: Wind },
  { id: "wingfoil", icon: Zap },
  { id: "surf", icon: Waves },
];

interface SportSwitcherProps {
  value: SportId;
  onChange: (sport: SportId) => void;
  className?: string;
}

export function SportSwitcher({ value, onChange, className }: SportSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 gap-0.5 min-w-0",
        className
      )}
      role="tablist"
      aria-label="Sport"
    >
      {SPORTS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap",
            value === id
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {SPORT_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
