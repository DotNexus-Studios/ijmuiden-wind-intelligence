import { RWS_ENDPOINTS } from "@/lib/constants";

export interface RwsRequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface RwsObservation {
  value: number;
  unit?: string;
  timestamp: string;
  quality?: string;
}

export interface RwsObservationBundle {
  speed?: RwsObservation;
  gust?: RwsObservation;
  direction?: RwsObservation;
}

export interface RwsApiError {
  source: "rws";
  endpoint: string;
  message: string;
  status?: number;
}

const DEFAULT_TIMEOUT = 20_000;

async function rwsPost<T>(
  endpoint: string,
  body: unknown,
  options: RwsRequestOptions = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT
  );

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: options.signal ?? controller.signal,
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw {
        source: "rws",
        endpoint,
        message: `RWS API returned ${res.status}`,
        status: res.status,
      } satisfies RwsApiError;
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

interface CatalogResponse {
  LocatieLijst?: Array<{
    Code?: string;
    Naam?: string;
    X?: number;
    Y?: number;
    Geometrie?: { punt?: { x?: number; y?: number } };
  }>;
}

interface ObservationResponse {
  WaarnemingenLijst?: Array<{
    MetingLijst?: Array<{
      Tijdstip?: string;
      Waarde?: number;
      Meetwaarde?: { Waarde?: number };
    }>;
  }>;
}

function parseObservationValue(entry: {
  Waarde?: number;
  Meetwaarde?: { Waarde?: number };
}): number | null {
  const v = entry.Waarde ?? entry.Meetwaarde?.Waarde;
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function buildAquoMetadata(
  grootheid: "WINDSHD" | "WINDRTG",
  hoedanigheid: "gemiddeld" | "max"
) {
  return {
    AquoMetadata: {
      Compartiment: { Code: "OW" },
      Grootheid: { Code: grootheid },
      Hoedanigheid: { Code: hoedanigheid },
      Parameter: { Code: "NVT" },
      BioTaxon: { Code: "NVT" },
      Orgaan: { Code: "NVT" },
      Groepering: { Code: "NVT" },
      Typering: { Code: "NVT" },
      WaardeBewerkingsMethode: { Code: "NVT" },
      ProcesType: "meting",
    },
  };
}

function periodLastHours(hours: number) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, ".000+00:00");
  return { Begindatumtijd: fmt(start), Einddatumtijd: fmt(end) };
}

function latestFromResponse(data: ObservationResponse): RwsObservation | undefined {
  const list = data.WaarnemingenLijst?.[0]?.MetingLijst;
  if (!list?.length) return undefined;

  const sorted = [...list].sort(
    (a, b) => new Date(b.Tijdstip ?? 0).getTime() - new Date(a.Tijdstip ?? 0).getTime()
  );
  const latest = sorted[0];
  const value = parseObservationValue(latest);
  if (value == null || !latest.Tijdstip) return undefined;

  return { value, timestamp: latest.Tijdstip };
}

function historyFromResponse(data: ObservationResponse): RwsObservation[] {
  const list = data.WaarnemingenLijst?.[0]?.MetingLijst ?? [];
  return list
    .map((m) => {
      const value = parseObservationValue(m);
      if (value == null || !m.Tijdstip) return null;
      return { value, timestamp: m.Tijdstip };
    })
    .filter((x): x is RwsObservation => x != null)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export class RwsClient {
  readonly endpoints = RWS_ENDPOINTS;

  async fetchCatalog(options?: RwsRequestOptions): Promise<CatalogResponse> {
    return rwsPost<CatalogResponse>(
      this.endpoints.metadata,
      {
        CatalogusFilter: {
          Compartimenten: true,
          Grootheden: true,
          Locaties: true,
        },
      },
      options
    );
  }

  async fetchObservations(
    stationCode: string,
    grootheid: "WINDSHD" | "WINDRTG",
    hoedanigheid: "gemiddeld" | "max" = "gemiddeld",
    hours = 6,
    options?: RwsRequestOptions
  ): Promise<ObservationResponse> {
    return rwsPost<ObservationResponse>(
      this.endpoints.observations,
      {
        Locatie: { Code: stationCode },
        AquoPlusWaarnemingMetadata: buildAquoMetadata(grootheid, hoedanigheid),
        Periode: periodLastHours(hours),
      },
      options
    );
  }

  async fetchWindBundle(
    stationCode: string,
    hours = 6,
    options?: RwsRequestOptions
  ): Promise<{ latest: RwsObservationBundle; history: { speed: RwsObservation[] } }> {
    const [speedRes, gustRes, dirRes] = await Promise.allSettled([
      this.fetchObservations(stationCode, "WINDSHD", "gemiddeld", hours, options),
      this.fetchObservations(stationCode, "WINDSHD", "max", hours, options),
      this.fetchObservations(stationCode, "WINDRTG", "gemiddeld", hours, options),
    ]);

    const speedData = speedRes.status === "fulfilled" ? speedRes.value : undefined;
    const gustData = gustRes.status === "fulfilled" ? gustRes.value : undefined;
    const dirData = dirRes.status === "fulfilled" ? dirRes.value : undefined;

    return {
      latest: {
        speed: speedData ? latestFromResponse(speedData) : undefined,
        gust: gustData ? latestFromResponse(gustData) : undefined,
        direction: dirData ? latestFromResponse(dirData) : undefined,
      },
      history: {
        speed: speedData ? historyFromResponse(speedData) : [],
      },
    };
  }
}

export const rwsClient = new RwsClient();

export function observationAgeMinutes(obs?: RwsObservation): number | null {
  if (!obs?.timestamp) return null;
  return (Date.now() - new Date(obs.timestamp).getTime()) / 60_000;
}

export function freshnessLevel(ageMinutes: number | null): "green" | "orange" | "red" {
  if (ageMinutes == null) return "red";
  if (ageMinutes < 10) return "green";
  if (ageMinutes <= 30) return "orange";
  return "red";
}
