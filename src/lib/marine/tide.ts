export type TidePhase = "opkomend" | "vloed" | "terugtrekkend" | "eb";

export interface TidePoint {
  time: string;
  levelM: number;
}

export interface TideInfo {
  phase: TidePhase;
  label: string;
  description: string;
  levelM: number | null;
  nextEventLabel: string | null;
  nextEventTime: string | null;
}

const PHASE_LABELS: Record<TidePhase, string> = {
  opkomend: "Opkomend",
  vloed: "Vloed (hoogwater)",
  terugtrekkend: "Terugtrekkend",
  eb: "Eb (laagwater)",
};

const PHASE_DESCRIPTIONS: Record<TidePhase, string> = {
  opkomend: "Het water stijgt richting hoogwater.",
  vloed: "Hoogwater of kort daarna.",
  terugtrekkend: "Het water zakt richting laagwater.",
  eb: "Laagwater of kort daarna.",
};

function findIndexClosestToNow(times: string[]): number {
  const now = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function isLocalExtremum(values: number[], idx: number, mode: "max" | "min"): boolean {
  const prev = values[idx - 1];
  const next = values[idx + 1];
  const cur = values[idx];
  if (prev == null || next == null) return false;
  if (mode === "max") return cur >= prev && cur >= next;
  return cur <= prev && cur <= next;
}

function findNextExtremum(
  times: string[],
  levels: number[],
  startIdx: number,
  mode: "max" | "min"
): { time: string; levelM: number } | null {
  for (let i = startIdx + 1; i < levels.length - 1; i++) {
    if (isLocalExtremum(levels, i, mode)) {
      return { time: times[i], levelM: levels[i] };
    }
  }
  return null;
}

export function analyzeTideFromSeaLevel(
  times: string[],
  levels: (number | null | undefined)[]
): TideInfo {
  const paired: TidePoint[] = [];
  for (let i = 0; i < times.length; i++) {
    const levelM = levels[i];
    if (typeof levelM === "number" && Number.isFinite(levelM)) {
      paired.push({ time: times[i], levelM });
    }
  }

  if (paired.length < 3) {
    return {
      phase: "opkomend",
      label: PHASE_LABELS.opkomend,
      description: "Getijdata niet beschikbaar.",
      levelM: null,
      nextEventLabel: null,
      nextEventTime: null,
    };
  }

  const idx = findIndexClosestToNow(paired.map((p) => p.time));
  const levelSeries = paired.map((p) => p.levelM);
  const timeSeries = paired.map((p) => p.time);
  const nowLevel = levelSeries[idx];

  const prevLevel = levelSeries[Math.max(0, idx - 1)];
  const nextLevel = levelSeries[Math.min(levelSeries.length - 1, idx + 1)];
  const delta = nextLevel - prevLevel;
  const slopeThreshold = 0.03;

  let phase: TidePhase;
  if (Math.abs(delta) < slopeThreshold) {
    if (isLocalExtremum(levelSeries, idx, "max")) phase = "vloed";
    else if (isLocalExtremum(levelSeries, idx, "min")) phase = "eb";
    else phase = delta >= 0 ? "opkomend" : "terugtrekkend";
  } else if (delta > slopeThreshold) {
    phase = "opkomend";
  } else {
    phase = "terugtrekkend";
  }

  const nextHigh = findNextExtremum(timeSeries, levelSeries, idx, "max");
  const nextLow = findNextExtremum(timeSeries, levelSeries, idx, "min");

  let nextEventLabel: string | null = null;
  let nextEventTime: string | null = null;

  if (phase === "opkomend" || phase === "eb") {
    if (nextHigh) {
      nextEventLabel = "Hoogwater";
      nextEventTime = nextHigh.time;
    }
  } else {
    if (nextLow) {
      nextEventLabel = "Laagwater";
      nextEventTime = nextLow.time;
    }
  }

  if (!nextEventTime && nextHigh && nextLow) {
    const pick =
      new Date(nextHigh.time).getTime() < new Date(nextLow.time).getTime() ? nextHigh : nextLow;
    nextEventLabel = pick === nextHigh ? "Hoogwater" : "Laagwater";
    nextEventTime = pick.time;
  }

  return {
    phase,
    label: PHASE_LABELS[phase],
    description: PHASE_DESCRIPTIONS[phase],
    levelM: nowLevel,
    nextEventLabel,
    nextEventTime,
  };
}
