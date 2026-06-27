/** IJmuiden harbour mouth - primary spot for kitesurfers */
export const IJMUIDEN = {
  lat: 52.4602,
  lon: 4.5913,
  name: "IJmuiden",
} as const;

/** IJmuiden aan zee - golfsurf spot (havenhoofd / line-up) */
export const IJMUIDEN_AAN_ZEE = {
  lat: 52.4637,
  lon: 4.5323,
  name: "IJmuiden aan zee",
} as const;

/** RWS Waterwebservices endpoints (ddapi20 is the current API) */
export const RWS_ENDPOINTS = {
  metadata: [
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/METADATASERVICES/OphalenCatalogus",
  ],
  observations: [
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen",
  ],
  latestObservations: [
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenLaatsteWaarnemingen",
  ],
  checkObservations: [
    "https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/CheckWaarnemingenAanwezig",
  ],
} as const;

export const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

export const OPEN_METEO_MARINE_BASE = "https://marine-api.open-meteo.com/v1/marine";

export const CACHE_REVALIDATE_SECONDS = 300;

export const RWS_USER_AGENT = "IJmuidenWindIntelligence/1.0 (watersport dashboard; dev@dotnexus.nl)";
