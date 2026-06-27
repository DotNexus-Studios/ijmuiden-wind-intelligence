"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SportId } from "@/lib/watersport/sports";

const STORAGE_KEY = "ijmuiden-sport";

interface SportContextValue {
  sport: SportId;
  setSport: (sport: SportId) => void;
}

const SportContext = createContext<SportContextValue | null>(null);

export function SportProvider({ children }: { children: ReactNode }) {
  const [sport, setSportState] = useState<SportId>("kite");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SportId | null;
    if (stored === "kite" || stored === "wingfoil" || stored === "surf") {
      setSportState(stored);
    }
  }, []);

  const setSport = (next: SportId) => {
    setSportState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <SportContext.Provider value={{ sport, setSport }}>{children}</SportContext.Provider>
  );
}

export function useSport() {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error("useSport must be used within SportProvider");
  return ctx;
}
