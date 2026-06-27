"use client";

import { Loader2 } from "lucide-react";
import { UI } from "@/lib/i18n/nl";
import { cn } from "@/lib/utils";

export type LoadPhase = "initial" | "forecast" | "complete" | "error";

interface LoadingBannerProps {
  phase: LoadPhase;
  className?: string;
}

export function LoadingBanner({ phase, className }: LoadingBannerProps) {
  if (phase === "complete" || phase === "error") return null;

  const message = phase === "initial" ? UI.loadingInitial : UI.loadingLive;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-blue-900",
        className
      )}
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="font-semibold">{message}</p>
        {phase === "forecast" && (
          <p className="text-xs text-blue-700/80 mt-0.5">{UI.loadingLiveHint}</p>
        )}
      </div>
    </div>
  );
}
