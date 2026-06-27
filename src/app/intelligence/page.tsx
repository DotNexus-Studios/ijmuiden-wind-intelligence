"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard";
import { DataIntelligenceView } from "@/components/dashboard/data-intelligence-view";
import { SportProvider } from "@/components/dashboard/sport-context";
import { UI } from "@/lib/i18n/nl";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function IntelligenceContent() {
  const [weight, setWeight] = useState<RiderWeight>("medium");
  const { data, phase, loading, polling, error, refresh } = useDashboardData(weight);

  if (phase === "error" && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">{UI.loadError}</p>
        <Button onClick={() => refresh()}>{UI.tryAgain}</Button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground py-8">{UI.loadingInitial}</p>;
  }

  return (
    <DataIntelligenceView
      data={data}
      riderWeight={weight}
      onWeightChange={setWeight}
      onRefresh={refresh}
      loading={loading || polling}
    />
  );
}

export default function IntelligencePage() {
  return (
    <SportProvider>
      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 min-w-0 w-full">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{UI.dataIntelligence}</h2>
          <IntelligenceContent />
        </div>
      </main>
    </SportProvider>
  );
}
