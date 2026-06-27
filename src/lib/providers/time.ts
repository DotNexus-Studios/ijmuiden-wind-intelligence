export function observationAgeMinutes(timestampMs: number): number {
  return Math.max(0, Math.round((Date.now() - timestampMs) / 60_000));
}

/** Open-Meteo current.time is local wall time without offset (see utc_offset_seconds). */
export function parseOpenMeteoCurrentTime(
  localTime: string,
  utcOffsetSeconds: number
): { timestamp: string; ageMinutes: number } {
  const [datePart, timePart = "00:00"] = localTime.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute = 0] = timePart.split(":").map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - utcOffsetSeconds * 1000;
  return {
    timestamp: new Date(utcMs).toISOString(),
    ageMinutes: observationAgeMinutes(utcMs),
  };
}

/** Aviation Weather METAR obsTime is Unix seconds; reportTime is ISO UTC. */
export function parseMetarObservationTime(row: {
  obsTime?: number | string;
  reportTime?: string;
}): { timestamp: string; ageMinutes: number } | null {
  if (row.obsTime != null) {
    const raw = typeof row.obsTime === "string" ? Number(row.obsTime) : row.obsTime;
    if (Number.isFinite(raw) && raw > 0) {
      const ms = raw < 1_000_000_000_000 ? raw * 1000 : raw;
      if (ms > 1_000_000_000_000) {
        return {
          timestamp: new Date(ms).toISOString(),
          ageMinutes: observationAgeMinutes(ms),
        };
      }
    }
  }

  if (row.reportTime) {
    const ms = new Date(row.reportTime).getTime();
    if (!Number.isNaN(ms)) {
      return {
        timestamp: new Date(ms).toISOString(),
        ageMinutes: observationAgeMinutes(ms),
      };
    }
  }

  return null;
}

/** Allow gridded model "current" steps that may be up to one interval ahead of wall clock. */
export function isAcceptableObservationTime(
  timestampMs: number,
  maxFutureMinutes = 20
): boolean {
  const futureMs = timestampMs - Date.now();
  return futureMs <= maxFutureMinutes * 60_000;
}
