import { IJMUIDEN_AAN_ZEE, OPEN_METEO_MARINE_BASE } from "@/lib/constants";

export interface MarinePoint {
  time: string;
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  swellHeightM: number;
  swellPeriodS: number;
  windWaveHeightM: number;
  seaSurfaceTempC?: number;
  seaLevelM?: number;
}

export async function fetchMarineForecast(hours = 72): Promise<MarinePoint[]> {
  const params = new URLSearchParams({
    latitude: String(IJMUIDEN_AAN_ZEE.lat),
    longitude: String(IJMUIDEN_AAN_ZEE.lon),
    hourly:
      "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,sea_surface_temperature,sea_level_height_msl",
    timezone: "Europe/Amsterdam",
    forecast_days: String(Math.ceil(hours / 24) + 1),
  });

  const res = await fetch(`${OPEN_METEO_MARINE_BASE}?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo Marine failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    hourly: {
      time: string[];
      wave_height?: number[];
      wave_period?: number[];
      wave_direction?: number[];
      swell_wave_height?: number[];
      swell_wave_period?: number[];
      wind_wave_height?: number[];
      sea_surface_temperature?: number[];
      sea_level_height_msl?: number[];
    };
  };

  const h = data.hourly;
  const points: MarinePoint[] = [];

  for (let i = 0; i < (h.time?.length ?? 0) && points.length < hours; i++) {
    const waveHeightM = h.wave_height?.[i];
    const wavePeriodS = h.wave_period?.[i];
    const waveDirectionDeg = h.wave_direction?.[i];
    if (typeof waveHeightM !== "number" || typeof wavePeriodS !== "number") continue;

    points.push({
      time: h.time[i],
      waveHeightM,
      wavePeriodS,
      waveDirectionDeg: typeof waveDirectionDeg === "number" ? waveDirectionDeg : 270,
      swellHeightM: h.swell_wave_height?.[i] ?? 0,
      swellPeriodS: h.swell_wave_period?.[i] ?? 0,
      windWaveHeightM: h.wind_wave_height?.[i] ?? 0,
      seaSurfaceTempC: h.sea_surface_temperature?.[i],
      seaLevelM: h.sea_level_height_msl?.[i],
    });
  }

  return points;
}
