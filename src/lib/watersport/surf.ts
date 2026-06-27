import { isOffshoreWind, msToKnots } from "@/lib/units/wind";
import type { MarinePoint } from "@/lib/marine/open-meteo-marine";

export type SurfStatus = "GO" | "WAIT" | "NO GO" | "FLAT";

export interface SurfAssessmentInput {
  waveHeightM: number;
  wavePeriodS: number;
  swellHeightM?: number;
  swellPeriodS?: number;
  windSpeedMs: number;
  windDirectionDeg: number;
}

export interface SurfTimelinePoint {
  time: string;
  waveHeightM: number;
  wavePeriodS: number;
  swellHeightM: number;
  status: SurfStatus;
  score: number;
  label: string;
}

export interface SurfWindow {
  start: string;
  end: string;
  peakHeightM: number;
  peakPeriodS: number;
  avgScore: number;
}

export interface SurfAssessment {
  status: SurfStatus;
  score: number;
  headline: string;
  explanation: string;
  warnings: string[];
  now: {
    waveHeightM: number;
    wavePeriodS: number;
    swellHeightM: number;
    swellPeriodS: number;
    waveDirectionDeg: number;
    effectiveHeightM: number;
  };
  bestWindow: SurfWindow | null;
  timeline: SurfTimelinePoint[];
}

function effectiveWaveHeight(input: SurfAssessmentInput): number {
  const swell = input.swellHeightM ?? 0;
  return Math.max(input.waveHeightM, swell * 0.85);
}

function scoreSurfPoint(input: SurfAssessmentInput): { score: number; status: SurfStatus; label: string } {
  const h = effectiveWaveHeight(input);
  const period = Math.max(input.wavePeriodS, input.swellPeriodS ?? 0);
  const windKt = msToKnots(input.windSpeedMs);
  const offshore = isOffshoreWind(input.windDirectionDeg);

  if (h < 0.35) {
    return { score: 5, status: "FLAT", label: "Platte zee" };
  }

  let score = 0;

  if (h >= 1.5) score += 35;
  else if (h >= 1.0) score += 28;
  else if (h >= 0.7) score += 20;
  else if (h >= 0.5) score += 12;
  else score += 4;

  if (period >= 10) score += 30;
  else if (period >= 8) score += 24;
  else if (period >= 6) score += 16;
  else if (period >= 4) score += 8;
  else score -= 5;

  const swell = input.swellHeightM ?? 0;
  if (swell >= 0.5 && (input.swellPeriodS ?? 0) >= 7) score += 12;

  if (offshore && windKt > 8) score -= 25;
  else if (offshore) score -= 15;
  else if (windKt > 22) score -= 20;
  else if (windKt > 16) score -= 10;

  if (h >= 2.5) score -= 15;

  score = Math.max(0, Math.min(100, score));

  let status: SurfStatus;
  if (h < 0.45) status = "FLAT";
  else if (score >= 55 && h >= 0.7 && period >= 6) status = "GO";
  else if (score >= 30 && h >= 0.5) status = "WAIT";
  else status = "NO GO";

  const label =
    status === "GO"
      ? "Golfsurfen"
      : status === "WAIT"
        ? "Marginaal"
        : status === "FLAT"
          ? "Plat"
          : "Niet geschikt";

  return { score, status, label };
}

export function assessSurfConditions(input: SurfAssessmentInput): Omit<SurfAssessment, "bestWindow" | "timeline"> {
  const { score, status, label } = scoreSurfPoint(input);
  const warnings: string[] = [];
  const h = effectiveWaveHeight(input);
  const period = Math.max(input.wavePeriodS, input.swellPeriodS ?? 0);

  if (isOffshoreWind(input.windDirectionDeg)) {
    warnings.push("Aflandige wind maakt golven onregelmatig of plat.");
  }
  if (period < 5 && h >= 0.5) {
    warnings.push("Korte golfperiode: windslag, minder geschikt om te surfen.");
  }
  if (h >= 2.0) {
    warnings.push("Hoge golven: alleen voor ervaren surfers.");
  }
  if (msToKnots(input.windSpeedMs) > 20) {
    warnings.push("Harde wind: moeilijke omstandigheden in het water.");
  }

  const heightCm = Math.round(h * 100);
  const headline =
    status === "GO"
      ? `Golfsurfen mogelijk (${heightCm} cm, ${period.toFixed(1)} s)`
      : status === "WAIT"
        ? `Marginaal surfweer (${heightCm} cm)`
        : status === "FLAT"
          ? "Nu weinig tot geen golven"
          : "Nu niet geschikt om te golfsurfen";

  const explanation =
    status === "GO"
      ? `Significante golven van ~${heightCm} cm met periode ${period.toFixed(1)} s bij IJmuiden aan zee. ${label}.`
      : status === "WAIT"
        ? `Er zijn kleine golven (~${heightCm} cm). Check wind en getij: het kan marginaal zijn.`
        : status === "FLAT"
          ? "Golfhoogte onder de drempel voor surfen. Check de voorspelling voor later vandaag of morgen."
          : `Golven of wind zijn nu ongunstig voor golfsurfen (${heightCm} cm, periode ${period.toFixed(1)} s).`;

  return {
    status,
    score,
    headline,
    explanation,
    warnings,
    now: {
      waveHeightM: input.waveHeightM,
      wavePeriodS: input.wavePeriodS,
      swellHeightM: input.swellHeightM ?? 0,
      swellPeriodS: input.swellPeriodS ?? 0,
      waveDirectionDeg: 0,
      effectiveHeightM: h,
    },
  };
}

function findBestWindow(timeline: SurfTimelinePoint[]): SurfWindow | null {
  const candidates = timeline.filter(
    (p) => p.status === "GO" || (p.status === "WAIT" && p.score >= 35)
  );
  if (candidates.length === 0) return null;

  const best = candidates.reduce((a, b) => (b.score > a.score ? b : a));
  const bestTime = new Date(best.time).getTime();

  const block = candidates.filter(
    (p) => Math.abs(new Date(p.time).getTime() - bestTime) <= 3 * 3_600_000
  );

  return {
    start: block[0].time,
    end: block[block.length - 1].time,
    peakHeightM: Math.max(...block.map((p) => p.waveHeightM)),
    peakPeriodS: block.reduce((a, b) => (b.wavePeriodS > a.wavePeriodS ? b : a)).wavePeriodS,
    avgScore: Math.round(block.reduce((s, p) => s + p.score, 0) / block.length),
  };
}

export function buildSurfAssessment(
  marinePoints: MarinePoint[],
  forecastPoints: { time: string; speedMs: number; directionDeg: number }[],
  fallbackWind: { speedMs: number; directionDeg: number }
): SurfAssessment {
  const windAt = (time: string) => {
    const t = new Date(time).getTime();
    let best = forecastPoints[0];
    let bestDiff = Infinity;
    for (const p of forecastPoints) {
      const diff = Math.abs(new Date(p.time).getTime() - t);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = p;
      }
    }
    return best
      ? { speedMs: best.speedMs, directionDeg: best.directionDeg }
      : fallbackWind;
  };

  const timeline: SurfTimelinePoint[] = marinePoints.slice(0, 72).map((p) => {
    const wind = windAt(p.time);
    const { score, status, label } = scoreSurfPoint({
      waveHeightM: p.waveHeightM,
      wavePeriodS: p.wavePeriodS,
      swellHeightM: p.swellHeightM,
      swellPeriodS: p.swellPeriodS,
      windSpeedMs: wind.speedMs,
      windDirectionDeg: wind.directionDeg,
    });
    return {
      time: p.time,
      waveHeightM: p.waveHeightM,
      wavePeriodS: p.wavePeriodS,
      swellHeightM: p.swellHeightM,
      status,
      score,
      label,
    };
  });

  const nowPoint = marinePoints[0] ?? {
    waveHeightM: 0,
    wavePeriodS: 0,
    swellHeightM: 0,
    swellPeriodS: 0,
    waveDirectionDeg: 270,
    time: new Date().toISOString(),
    windWaveHeightM: 0,
  };

  const nowWind = windAt(nowPoint.time);

  const base = assessSurfConditions({
    waveHeightM: nowPoint.waveHeightM,
    wavePeriodS: nowPoint.wavePeriodS,
    swellHeightM: nowPoint.swellHeightM,
    swellPeriodS: nowPoint.swellPeriodS,
    windSpeedMs: nowWind.speedMs,
    windDirectionDeg: nowWind.directionDeg,
  });

  return {
    ...base,
    now: {
      ...base.now,
      waveDirectionDeg: nowPoint.waveDirectionDeg,
    },
    bestWindow: findBestWindow(timeline),
    timeline,
  };
}
