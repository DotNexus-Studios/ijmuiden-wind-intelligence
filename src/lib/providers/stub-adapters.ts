import type { WindProvider } from "@/lib/providers/types";

export const wundergroundProvider: WindProvider = {
  id: "weather-underground",
  label: "Weather Underground",
  enabled: Boolean(process.env.WU_API_KEY),
  async getWindObservations() {
    return [];
  },
};

export const cameraAiProvider: WindProvider = {
  id: "camera-ai",
  label: "Webcam AI",
  enabled: false,
  async getWindObservations() {
    return [];
  },
};
