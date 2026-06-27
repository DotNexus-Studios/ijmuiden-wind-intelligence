export type WeatherModelId = "harmonie" | "ecmwf" | "icon" | "gfs";

export interface WindPoint {
  time: string;
  speedMs: number;
  directionDeg: number;
  gustMs?: number;
}

export interface ModelForecast {
  model: WeatherModelId;
  modelLabel: string;
  fetchedAt: string;
  points: WindPoint[];
  /** Error vs RWS observations over recent windows (m/s RMSE) */
  errorTracking?: {
    h6?: number;
    h12?: number;
    h24?: number;
  };
}

export interface ModelAdapter {
  id: WeatherModelId;
  label: string;
  fetch(lat: number, lon: number, hours?: number): Promise<ModelForecast>;
}

export interface FusedForecastPoint {
  time: string;
  label: string;
  hoursFromNow: number;
  speedMs: number;
  directionDeg: number;
  gustMs: number;
  confidence: number;
  modelSpread: number;
  weights: Partial<Record<WeatherModelId, number>>;
}

export interface FusionResult {
  points: FusedForecastPoint[];
  timeline: FusedForecastPoint[];
  modelForecasts: ModelForecast[];
  disagreementScore: number;
  coastalCorrectionApplied: boolean;
}
