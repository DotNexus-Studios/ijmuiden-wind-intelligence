import { OPEN_METEO_BASE } from "@/lib/constants";
import type { ModelAdapter, ModelForecast, WindPoint } from "@/lib/weather-models/types";

interface OpenMeteoHourly {
  time: string[];
  wind_speed_10m?: number[];
  wind_direction_10m?: number[];
  wind_gusts_10m?: number[];
}

interface OpenMeteoResponse {
  hourly: OpenMeteoHourly;
}

export async function fetchOpenMeteoModel(
  lat: number,
  lon: number,
  modelKey: string,
  label: string,
  id: ModelForecast["model"],
  hours = 120
): Promise<ModelForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    hourly: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    models: modelKey,
    wind_speed_unit: "ms",
    timezone: "Europe/Amsterdam",
    forecast_days: String(Math.ceil(hours / 24) + 1),
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo ${label} failed: ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const { hourly } = data;
  const times = hourly.time ?? [];

  const points: WindPoint[] = [];
  for (let i = 0; i < times.length && points.length < hours; i++) {
    const speed = hourly.wind_speed_10m?.[i];
    const direction = hourly.wind_direction_10m?.[i];
    const gust = hourly.wind_gusts_10m?.[i];
    if (typeof speed !== "number" || typeof direction !== "number") continue;
    points.push({
      time: times[i],
      speedMs: speed,
      directionDeg: direction,
      ...(typeof gust === "number" ? { gustMs: gust } : {}),
    });
  }

  return {
    model: id,
    modelLabel: label,
    fetchedAt: new Date().toISOString(),
    points,
  };
}

export function createModelAdapter(
  id: ModelForecast["model"],
  label: string,
  modelKey: string
): ModelAdapter {
  return {
    id,
    label,
    fetch: (lat, lon, hours) => fetchOpenMeteoModel(lat, lon, modelKey, label, id, hours),
  };
}

export const harmonieAdapter = createModelAdapter(
  "harmonie",
  "KNMI HARMONIE-AROME",
  "knmi_harmonie_arome_netherlands"
);

export const ecmwfAdapter = createModelAdapter("ecmwf", "ECMWF IFS", "ecmwf_ifs025");

export const iconAdapter = createModelAdapter("icon", "ICON-D2", "icon_d2");

export const gfsAdapter = createModelAdapter("gfs", "GFS", "gfs_seamless");

export const ALL_MODEL_ADAPTERS = [harmonieAdapter, iconAdapter, ecmwfAdapter, gfsAdapter];

export async function fetchAllModels(lat: number, lon: number, hours = 120): Promise<ModelForecast[]> {
  const results = await Promise.allSettled(
    ALL_MODEL_ADAPTERS.map((a) => a.fetch(lat, lon, hours))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ModelForecast> => r.status === "fulfilled")
    .map((r) => r.value);
}
