import { RWS_ENDPOINTS, RWS_USER_AGENT } from "@/lib/constants";

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

export type RwsErrorKind = "connection" | "timeout" | "http" | "parse" | "empty";

export interface RwsApiError {
  source: "rws";
  kind: RwsErrorKind;
  endpoint: string;
  message: string;
  status?: number;
}

const DEFAULT_TIMEOUT = 25_000;

function amsterdamOffset(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const m = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return "+01:00";
  return `${m[1]}${m[2].padStart(2, "0")}:${(m[3] ?? "00").padStart(2, "0")}`;
}

export function formatRwsDateTime(date: Date): string {
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return `${local.replace(" ", "T")}.000${amsterdamOffset(date)}`;
}

function periodLastHours(hours: number) {
  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  return { Begindatumtijd: formatRwsDateTime(start), Einddatumtijd: formatRwsDateTime(end) };
}

async function rwsPost<T>(
  endpoints: readonly string[],
  body: unknown,
  options: RwsRequestOptions = {}
): Promise<{ data: T; endpoint: string }> {
  let lastError: RwsApiError | null = null;

  for (const endpoint of endpoints) {
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
          "User-Agent": RWS_USER_AGENT,
          "X-API-KEY": "ijmuiden-wind-intelligence",
        },
        body: JSON.stringify(body),
        signal: options.signal ?? controller.signal,
        cache: "no-store",
      });

      if (res.status === 204) {
        return { data: {} as T, endpoint };
      }

      const contentType = res.headers.get("content-type") ?? "";
      const raw = await res.text();

      if (!raw.trim()) {
        return { data: {} as T, endpoint };
      }

      if (
        raw.trimStart().startsWith("<") ||
        contentType.includes("text/html")
      ) {
        throw {
          source: "rws",
          kind: "http",
          endpoint,
          message: `Geen JSON-response van RWS (${res.status}, ${contentType || "HTML"})`,
          status: res.status,
        } satisfies RwsApiError;
      }

      let data: T & { Succesvol?: boolean; Foutmelding?: string };
      try {
        data = JSON.parse(raw) as T & { Succesvol?: boolean; Foutmelding?: string };
      } catch {
        throw {
          source: "rws",
          kind: "parse",
          endpoint,
          message: `Ongeldige JSON van RWS: ${raw.slice(0, 80)}`,
          status: res.status,
        } satisfies RwsApiError;
      }

      if (!res.ok) {
        throw {
          source: "rws",
          kind: "http",
          endpoint,
          message: `HTTP ${res.status}${data.Foutmelding ? `: ${data.Foutmelding}` : ""}`,
          status: res.status,
        } satisfies RwsApiError;
      }
      if (data.Succesvol === false) {
        throw {
          source: "rws",
          kind: "parse",
          endpoint,
          message: data.Foutmelding ?? "RWS API Succesvol=false",
        } satisfies RwsApiError;
      }

      return { data, endpoint };
    } catch (err) {
      if (err && typeof err === "object" && "kind" in err) {
        lastError = err as RwsApiError;
        continue;
      }
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isFetch = err instanceof TypeError || (err instanceof Error && err.message.includes("fetch failed"));
      lastError = {
        source: "rws",
        kind: isAbort ? "timeout" : isFetch ? "connection" : "parse",
        endpoint,
        message: isAbort
          ? `Timeout na ${options.timeoutMs ?? DEFAULT_TIMEOUT}ms`
          : err instanceof Error
            ? err.message
            : String(err),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? {
    source: "rws",
    kind: "connection",
    endpoint: endpoints[0],
    message: "Alle RWS endpoints onbereikbaar",
  };
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

interface MetingEntry {
  Tijdstip?: string;
  Waarde?: number;
  Meetwaarde?: { Waarde?: number; Waarde_Numeriek?: number };
}

interface ObservationResponse {
  WaarnemingenLijst?: Array<{
    Locatie?: { Code?: string };
    AquoMetadata?: { Grootheid?: { Code?: string }; Hoedanigheid?: { Code?: string } };
    MetingenLijst?: MetingEntry[];
    MetingLijst?: MetingEntry[];
  }>;
}

function parseObservationValue(entry: MetingEntry): number | null {
  const v = entry.Meetwaarde?.Waarde_Numeriek ?? entry.Meetwaarde?.Waarde ?? entry.Waarde;
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function getMetingenList(item: NonNullable<ObservationResponse["WaarnemingenLijst"]>[0]): MetingEntry[] {
  return item.MetingenLijst ?? item.MetingLijst ?? [];
}

type WindGrootheid = "WINDSHD" | "WINDRTG" | "WINDST" | "WS10";

function buildWindMetadata(grootheid: WindGrootheid) {
  return {
    AquoMetadata: {
      Compartiment: { Code: "LT" },
      Grootheid: { Code: grootheid },
      ProcesType: "meting",
    },
  };
}

const BATCH_WIND_METADATA = [
  buildWindMetadata("WINDSHD"),
  buildWindMetadata("WINDST"),
  buildWindMetadata("WINDRTG"),
] as const;

/** Ignore corrupt or archival rows that OphalenLaatsteWaarnemingen sometimes returns. */
const PLAUSIBLE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function isPlausibleTijdstip(tijdstip: string): boolean {
  const t = new Date(tijdstip).getTime();
  if (Number.isNaN(t)) return false;
  const ageMs = Date.now() - t;
  return ageMs >= 0 && ageMs <= PLAUSIBLE_MAX_AGE_MS;
}

function pickNewestObservation(a?: RwsObservation, b?: RwsObservation): RwsObservation | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.timestamp).getTime() >= new Date(b.timestamp).getTime() ? a : b;
}

export function mergeObservationBundles(
  a: RwsObservationBundle,
  b: RwsObservationBundle
): RwsObservationBundle {
  return {
    speed: pickNewestObservation(a.speed, b.speed),
    gust: pickNewestObservation(a.gust, b.gust),
    direction: pickNewestObservation(a.direction, b.direction),
  };
}

function latestFromResponse(data: ObservationResponse): RwsObservation | undefined {
  const all: MetingEntry[] = [];
  for (const item of data.WaarnemingenLijst ?? []) all.push(...getMetingenList(item));
  const plausible = all.filter((m) => m.Tijdstip && isPlausibleTijdstip(m.Tijdstip));
  if (!plausible.length) return undefined;
  const sorted = [...plausible].sort(
    (a, b) => new Date(b.Tijdstip ?? 0).getTime() - new Date(a.Tijdstip ?? 0).getTime()
  );
  const latest = sorted[0];
  const value = parseObservationValue(latest);
  if (value == null || !latest.Tijdstip) return undefined;
  return { value, timestamp: latest.Tijdstip };
}

function historyFromResponse(data: ObservationResponse): RwsObservation[] {
  const all: MetingEntry[] = [];
  for (const item of data.WaarnemingenLijst ?? []) all.push(...getMetingenList(item));
  return all
    .map((m) => {
      const value = parseObservationValue(m);
      if (value == null || !m.Tijdstip) return null;
      return { value, timestamp: m.Tijdstip };
    })
    .filter((x): x is RwsObservation => x != null)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function pickObservationFromLatestBatch(
  data: ObservationResponse,
  stationCode: string,
  grootheid: string
): RwsObservation | undefined {
  for (const item of data.WaarnemingenLijst ?? []) {
    if (item.Locatie?.Code !== stationCode) continue;
    if (item.AquoMetadata?.Grootheid?.Code !== grootheid) continue;
    const list = getMetingenList(item).filter(
      (m) => m.Tijdstip && isPlausibleTijdstip(m.Tijdstip)
    );
    const latest = [...list].sort(
      (a, b) => new Date(b.Tijdstip ?? 0).getTime() - new Date(a.Tijdstip ?? 0).getTime()
    )[0];
    if (!latest) continue;
    const value = parseObservationValue(latest);
    if (value != null && latest.Tijdstip) return { value, timestamp: latest.Tijdstip };
  }
  return undefined;
}

export class RwsClient {
  readonly endpoints = RWS_ENDPOINTS;

  async fetchCatalog(options?: RwsRequestOptions): Promise<CatalogResponse> {
    const { data } = await rwsPost<CatalogResponse>(
      this.endpoints.metadata,
      { CatalogusFilter: { Compartimenten: true, Grootheden: true, Locaties: true } },
      options
    );
    return data;
  }

  async fetchLatestWindBatch(stationCodes: string[], options?: RwsRequestOptions): Promise<ObservationResponse> {
    const { data } = await rwsPost<ObservationResponse>(
      this.endpoints.latestObservations,
      {
        LocatieLijst: stationCodes.map((Code) => ({ Code })),
        AquoPlusWaarnemingMetadataLijst: [...BATCH_WIND_METADATA],
      },
      options
    );
    return data;
  }

  async fetchObservations(
    stationCode: string,
    grootheid: WindGrootheid,
    hours = 6,
    options?: RwsRequestOptions
  ): Promise<ObservationResponse> {
    const { data } = await rwsPost<ObservationResponse>(
      this.endpoints.observations,
      {
        Locatie: { Code: stationCode },
        AquoPlusWaarnemingMetadata: buildWindMetadata(grootheid),
        Periode: periodLastHours(hours),
      },
      options
    );
    return data;
  }

  async fetchWindBundle(
    stationCode: string,
    hours = 6,
    options?: RwsRequestOptions
  ): Promise<{ latest: RwsObservationBundle; history: { speed: RwsObservation[] } }> {
    const speedData = await this.fetchObservations(stationCode, "WINDSHD", hours, options);
    let gustData: ObservationResponse | undefined;
    let dirData: ObservationResponse | undefined;
    try {
      [gustData, dirData] = await Promise.all([
        this.fetchObservations(stationCode, "WINDST", hours, options),
        this.fetchObservations(stationCode, "WINDRTG", hours, options),
      ]);
    } catch {
      // gust and direction are optional
    }
    return {
      latest: {
        speed: latestFromResponse(speedData),
        gust: gustData ? latestFromResponse(gustData) : undefined,
        direction: dirData ? latestFromResponse(dirData) : undefined,
      },
      history: { speed: historyFromResponse(speedData) },
    };
  }

  parseLatestBatchForStation(data: ObservationResponse, stationCode: string): RwsObservationBundle {
    return {
      speed: pickObservationFromLatestBatch(data, stationCode, "WINDSHD"),
      gust: pickObservationFromLatestBatch(data, stationCode, "WINDST"),
      direction: pickObservationFromLatestBatch(data, stationCode, "WINDRTG"),
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

export function rwsErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "kind" in err && "message" in err) {
    const e = err as RwsApiError;
    return `[${e.kind}] ${e.message}`;
  }
  return err instanceof Error ? err.message : "Onbekende RWS-fout";
}
