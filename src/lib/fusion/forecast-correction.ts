import { forecastCorrectionFactor } from "@/lib/fusion/weights";
import type { WeatherModelId } from "@/lib/weather-models/types";

/** Bias = forecast(now) - realtime fused; correction subtracts bias scaled by time factor */
export function computeModelBiases(
  models: Array<{ model: WeatherModelId; points: Array<{ time: string; speedMs: number }> }>,
  realtimeSpeedMs: number
): Partial<Record<WeatherModelId, number>> {
  const bias: Partial<Record<WeatherModelId, number>> = {};
  const now = Date.now();

  for (const model of models) {
    const nowPoint = model.points.reduce<(typeof model.points)[0] | null>((best, p) => {
      const diff = Math.abs(new Date(p.time).getTime() - now);
      if (diff >= 3_600_000) return best;
      if (!best) return p;
      const bestDiff = Math.abs(new Date(best.time).getTime() - now);
      return diff < bestDiff ? p : best;
    }, null);

    if (nowPoint) {
      bias[model.model] = nowPoint.speedMs - realtimeSpeedMs;
    }
  }

  return bias;
}

export function applyBiasCorrection(
  forecastSpeedMs: number,
  model: WeatherModelId,
  hoursAhead: number,
  biases: Partial<Record<WeatherModelId, number>>
): number {
  const bias = biases[model];
  if (bias == null) return forecastSpeedMs;
  const factor = forecastCorrectionFactor(hoursAhead);
  return forecastSpeedMs - bias * factor;
}

export { forecastCorrectionFactor };
