/** IJmuiden harbour mouth - primary spot for kitesurfers */
export const IJMUIDEN = {
  lat: 52.4602,
  lon: 4.5913,
  name: "IJmuiden",
} as const;

/** RWS Waterwebservices base URLs - isolated for migration */
export const RWS_ENDPOINTS = {
  /** Current ddapi20 endpoints (2025+) */
  metadata: "https://ddapi20-waterwebservices.rijkswaterstaat.nl/METADATASERVICES/OphalenCatalogus",
  observations:
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen",
  checkObservations:
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/CheckWaarnemingenAanwezig",
} as const;

export const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

export const CACHE_REVALIDATE_SECONDS = 300;
