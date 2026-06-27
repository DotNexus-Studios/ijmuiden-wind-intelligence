"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard";
import type { RiderWeight } from "@/lib/watersport/kite-size";
import { UI } from "@/lib/i18n/nl";

const POLL_INTERVAL_MS = 60_000;

interface LivePollResponse {
  fetchedAt: string;
  observationTimestamp: string | null;
  ageMinutes: number | null;
  freshness: "green" | "orange" | "red";
  hasLive: boolean;
  usedFallback: boolean;
  station: DashboardData["live"]["station"];
  live: {
    speedMs: number;
    gustMs: number;
    directionDeg: number;
    trend: DashboardData["live"]["trend"];
    formatted: DashboardData["live"]["formatted"];
  } | null;
}

export function useDashboardData(weight: RiderWeight) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMeasurement, setNewMeasurement] = useState(false);
  const lastObservationRef = useRef<string | null>(null);

  const fetchFull = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?weight=${weight}`, { cache: "no-store" });
      if (!res.ok) throw new Error(UI.loadError);
      const json = (await res.json()) as DashboardData;
      if (json.observationTimestamp) {
        lastObservationRef.current = json.observationTimestamp;
      }
      setData(json);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : UI.loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [weight]);

  const pollLive = useCallback(async () => {
    setPolling(true);
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const liveData = (await res.json()) as LivePollResponse;

      setData((prev) => {
        if (!prev) return prev;

        const obs = liveData.observationTimestamp;
        const isNewReading =
          obs != null &&
          lastObservationRef.current != null &&
          obs !== lastObservationRef.current;

        if (obs) lastObservationRef.current = obs;
        if (isNewReading) setNewMeasurement(true);

        if (!liveData.live) {
          return { ...prev, syncedAt: liveData.fetchedAt };
        }

        return {
          ...prev,
          syncedAt: liveData.fetchedAt,
          observationTimestamp: obs ?? prev.observationTimestamp,
          live: {
            ...prev.live,
            speedMs: liveData.live.speedMs,
            gustMs: liveData.live.gustMs,
            directionDeg: liveData.live.directionDeg,
            trend: liveData.live.trend,
            formatted: liveData.live.formatted,
            ageMinutes: liveData.ageMinutes,
            freshness: liveData.freshness,
            station: liveData.station,
            usedFallback: liveData.usedFallback,
          },
        };
      });
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    fetchFull();
  }, [fetchFull]);

  useEffect(() => {
    const interval = setInterval(pollLive, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollLive]);

  useEffect(() => {
    if (!newMeasurement) return;
    const timer = setTimeout(() => setNewMeasurement(false), 4000);
    return () => clearTimeout(timer);
  }, [newMeasurement]);

  const refresh = useCallback(async () => {
    await fetchFull(true);
    await pollLive();
  }, [fetchFull, pollLive]);

  return {
    data,
    loading,
    polling,
    error,
    newMeasurement,
    refresh,
    fetchFull,
  };
}
