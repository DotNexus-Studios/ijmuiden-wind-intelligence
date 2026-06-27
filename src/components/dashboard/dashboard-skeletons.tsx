"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { UI } from "@/lib/i18n/nl";
import { SectionHeader } from "@/components/dashboard/section-header";

function CardShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`dashboard-card p-5 sm:p-6 min-w-0 max-w-full ${className ?? ""}`}>
      {children}
    </section>
  );
}

export function HeroCardSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.currentConditions} />
      <Skeleton className="h-4 w-40 mb-6" />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
        <div className="space-y-4 min-w-0">
          <Skeleton className="h-14 w-32 max-w-full" />
          <Skeleton className="h-2.5 w-full max-w-sm" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-0">
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-4 w-56 mt-6" />
    </CardShell>
  );
}

export function ForecastOverviewSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.forecastOverview} />
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-[88px] shrink-0 rounded-xl" />
        ))}
      </div>
    </CardShell>
  );
}

export function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <CardShell>
      <SectionHeader title={title} />
      <Skeleton className="h-52 w-full rounded-xl" />
    </CardShell>
  );
}

export function TableCardSkeleton() {
  return (
    <CardShell>
      <SectionHeader title={UI.modelComparison} />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </CardShell>
  );
}

export function KiteCalculatorSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.kiteSize} />
      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
    </CardShell>
  );
}

export function StationInfoSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.stationInfo} />
      <div className="grid md:grid-cols-[auto_1fr] gap-6 items-center min-w-0">
        <Skeleton className="h-36 w-36 rounded-full mx-auto shrink-0" />
        <div className="space-y-3 min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </CardShell>
  );
}

export function SafetyCheckSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.safetyDetails} />
      <Skeleton className="h-24 w-full rounded-xl mb-4" />
      <div className="space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </CardShell>
  );
}

export function SurfCardSkeleton() {
  return (
    <CardShell className="h-full">
      <SectionHeader title={UI.surfConditions} />
      <Skeleton className="h-4 w-48 mb-4" />
      <Skeleton className="h-16 w-full mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <Skeleton className="h-44 w-full rounded-xl" />
    </CardShell>
  );
}

export function StickyBarSkeleton() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(15,23,42,0.08)] safe-bottom">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="h-7 w-16 shrink-0 rounded-md" />
          <div className="flex-1 grid grid-cols-3 gap-2 min-w-0 sm:flex sm:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full sm:w-16 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}
