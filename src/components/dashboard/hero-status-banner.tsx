"use client";

import { cn } from "@/lib/utils";
import { UI } from "@/lib/i18n/nl";
import type { GoStatus } from "@/lib/watersport/safety";
import { STATUS_LABELS } from "@/lib/i18n/nl";

const BANNER_STYLES: Record<GoStatus, string> = {
  GO: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600/30 shadow-emerald-500/20",
  WAIT: "bg-gradient-to-r from-amber-400 to-amber-500 text-white border-amber-500/30 shadow-amber-400/20",
  "EXPERT ONLY": "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500/30 shadow-orange-500/20",
  "NO GO": "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500/30 shadow-red-500/20",
};

interface HeroStatusBannerProps {
  status: GoStatus;
  label?: string;
  className?: string;
}

export function HeroStatusBanner({ status, label, className }: HeroStatusBannerProps) {
  const text = label ?? STATUS_LABELS[status];
  const isPump = label === UI.pumpCall;

  return (
    <div
      className={cn(
        "-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 sm:mb-6 px-4 py-4 sm:py-5",
        "rounded-t-[inherit] border-b shadow-lg",
        BANNER_STYLES[status],
        className
      )}
      role="status"
    >
      <p
        className={cn(
          "text-center font-bold tracking-tight leading-none",
          isPump ? "text-3xl sm:text-5xl" : "text-4xl sm:text-6xl"
        )}
      >
        {text}
      </p>
    </div>
  );
}
