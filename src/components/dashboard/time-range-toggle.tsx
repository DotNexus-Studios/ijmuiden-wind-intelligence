"use client";

import { cn } from "@/lib/utils";

interface TimeRangeToggleProps {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function TimeRangeToggle({ options, value, onChange }: TimeRangeToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors",
            value === opt
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
