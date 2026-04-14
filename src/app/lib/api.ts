import type {
  Ticker,
  OHLCVResponse,
  AnalysisResponse,
  HistoricalResponse,
  CompareResponse,
  Portfolio,
  PortfolioHolding,
  PortfolioAnalysisResponse,
  MacroData,
  ScoreWeights,
  CompositeSignal,
} from "./types";

export interface ScoreWeightsResponse {
  weights: ScoreWeights;
  raw: ScoreWeights;
  presets?: Record<string, ScoreWeights>;
  default?: ScoreWeights;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

// ---- Tickers ----

export async function fetchTickers(filters?: {
  index?: string;
  sector?: string;
  search?: string;
}): Promise<Ticker[]> {
  const params = new URLSearchParams();
  if (filters?.index) params.set("index", filters.index);
  if (filters?.sector) params.set("sector", filters.sector);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return fetchJSON<Ticker[]>(`${BASE}/tickers${qs ? `?${qs}` : ""}`);
}

export async function validateTicker(
  symbol: string
): Promise<{ symbol: string; valid: boolean | null; name: string | null }> {
  return fetchJSON(`${BASE}/tickers?validate=${encodeURIComponent(symbol)}`);
}

// ---- Market Data ----

export async function fetchOHLCV(
  symbol: string,
  interval = "Daily",
  bars = 100
): Promise<OHLCVResponse> {
  return fetchJSON<OHLCVResponse>(
    `${BASE}/ohlcv?symbol=${symbol}&interval=${interval}&bars=${bars}`
  );
}

export async function fetchAnalysis(
  symbol: string,
  interval = "Daily",
  bars = 200
): Promise<AnalysisResponse> {
  return fetchJSON<AnalysisResponse>(
    `${BASE}/analysis?symbol=${symbol}&interval=${interval}&bars=${bars}`
  );
}

export async function fetchHistorical(
  symbols: string[],
  interval = "Daily",
  start?: string,
  end?: string
): Promise<HistoricalResponse> {
  const params = new URLSearchParams({ symbols: symbols.join(","), interval });
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return fetchJSON<HistoricalResponse>(`${BASE}/historical?${params}`);
}

export async function fetchComparison(
  symbols: string[],
  interval = "Daily",
  start?: string,
  end?: string
): Promise<CompareResponse> {
  const params = new URLSearchParams({ symbols: symbols.join(","), interval });
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return fetchJSON<CompareResponse>(`${BASE}/compare?${params}`);
}

// ---- Portfolio CRUD ----

export async function fetchPortfolio(): Promise<Portfolio> {
  return fetchJSON<Portfolio>(`${BASE}/portfolio`);
}

export async function addHolding(
  holding: Omit<PortfolioHolding, "id" | "created_at" | "updated_at">
): Promise<PortfolioHolding> {
  return fetchJSON<PortfolioHolding>(`${BASE}/portfolio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(holding),
  });
}

export async function updateHolding(
  id: string,
  updates: Partial<PortfolioHolding>
): Promise<PortfolioHolding> {
  return fetchJSON<PortfolioHolding>(`${BASE}/portfolio?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function deleteHolding(id: string): Promise<{ deleted: string }> {
  return fetchJSON<{ deleted: string }>(`${BASE}/portfolio?id=${id}`, {
    method: "DELETE",
  });
}

// ---- Portfolio Analysis ----

export async function fetchPortfolioAnalysis(): Promise<PortfolioAnalysisResponse> {
  return fetchJSON<PortfolioAnalysisResponse>(`${BASE}/portfolio_analysis`);
}

// ---- Macro ----

export async function fetchMacro(): Promise<MacroData> {
  return fetchJSON<MacroData>(`${BASE}/macro`);
}

// ---- Settings ----

export async function updateCash(amount: number): Promise<{ key: string; value: string }> {
  return fetchJSON<{ key: string; value: string }>(`${BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "cash_available", value: String(amount) }),
  });
}

// ---- Watchlist ----

export async function fetchWatchlist(): Promise<{ symbols: string[] }> {
  return fetchJSON<{ symbols: string[] }>(`${BASE}/watchlist`);
}

export async function addToWatchlist(symbol: string): Promise<{ symbol: string; added_at: string }> {
  return fetchJSON<{ symbol: string; added_at: string }>(`${BASE}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
}

export async function removeFromWatchlist(symbol: string): Promise<{ deleted: string }> {
  return fetchJSON<{ deleted: string }>(
    `${BASE}/watchlist?symbol=${encodeURIComponent(symbol)}`,
    { method: "DELETE" }
  );
}

// ---- Composite Score Weights ----

export async function fetchScoreWeights(): Promise<ScoreWeightsResponse> {
  return fetchJSON<ScoreWeightsResponse>(`${BASE}/settings?section=weights`);
}

export async function updateScoreWeights(
  weights: Partial<ScoreWeights>
): Promise<ScoreWeightsResponse> {
  return fetchJSON<ScoreWeightsResponse>(`${BASE}/settings?section=weights`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ weights }),
  });
}

// ---- Composite Score Batch (dashboard cards) ----

export interface CompositeBatchEntry {
  score: number;
  signal: CompositeSignal;
  price?: number;
  change?: number;
  change_pct?: number;
  sparkline?: number[];
}

export interface CompositeBatchResponse {
  scores: Record<string, CompositeBatchEntry>;
  errors: Array<{ symbol: string; error: string }>;
}

const COMPOSITE_CHUNK_SIZE = 6;

export async function fetchCompositeBatch(
  symbols: string[],
  interval = "Daily"
): Promise<CompositeBatchResponse> {
  if (!symbols.length) return { scores: {}, errors: [] };

  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += COMPOSITE_CHUNK_SIZE) {
    chunks.push(symbols.slice(i, i + COMPOSITE_CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) => {
      const params = new URLSearchParams({
        mode: "batch",
        symbols: chunk.join(","),
        interval,
      });
      return fetchJSON<CompositeBatchResponse>(
        `${BASE}/analysis?${params}`
      ).catch((): CompositeBatchResponse => ({
        scores: {},
        errors: chunk.map((s) => ({ symbol: s, error: "request failed" })),
      }));
    })
  );

  return results.reduce<CompositeBatchResponse>(
    (acc, r) => ({
      scores: { ...acc.scores, ...r.scores },
      errors: [...acc.errors, ...r.errors],
    }),
    { scores: {}, errors: [] }
  );
}
