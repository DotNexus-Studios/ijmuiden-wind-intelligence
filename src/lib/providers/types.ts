import type { WindObservation } from "@/lib/fusion/types";

export interface WindProvider {
  id: string;
  label: string;
  enabled?: boolean;
  getWindObservations(): Promise<WindObservation[]>;
}

export type { WindObservation } from "@/lib/fusion/types";
