import { COMPOSITE_BATCH_MAX_SYMBOLS } from "./constants";
import {
  getStoredToken,
  notifyUnauthorized,
} from "../components/AuthProvider";
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
  Sale,
  SalesResponse,
  Dividend,
} from "./types";

export interface ScoreWeightsResponse {
  weights: ScoreWeights;
  raw: ScoreWeights;
  presets?: Record<string, ScoreWeights>;
  default?: ScoreWeights;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    notifyUnauthorized();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.detail || `Request failed: ${res.status}`);
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

// ---- Sales / Realized gains ----

export async function fetchSales(): Promise<SalesResponse> {
  return fetchJSON<SalesResponse>(`${BASE}/sales`);
}

export async function recordSale(body: {
  holding_id: string;
  quantity: number;
  sell_price: number;
  sell_date: string;
  notes?: string;
}): Promise<{ sale: Sale; holding: PortfolioHolding }> {
  return fetchJSON<{ sale: Sale; holding: PortfolioHolding }>(`${BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteSale(
  id: string
): Promise<{ deleted: string; holding_id: string; restored_quantity: number | null }> {
  return fetchJSON(`${BASE}/sales?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---- Dividends ----
// Reads arrive on fetchSales(): the Winnings headline is gains + dividends and
// that sum is computed server-side, so the card needs one fetch, not two.

export async function recordDividend(body: {
  symbol: string;
  name?: string;
  sector?: string;
  amount: number;
  pay_date: string;
  shares?: number | null;
  notes?: string;
}): Promise<{ dividend: Dividend }> {
  return fetchJSON<{ dividend: Dividend }>(`${BASE}/dividends`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteDividend(id: string): Promise<{ deleted: string }> {
  return fetchJSON(`${BASE}/dividends?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---- Macro ----

export async function fetchMacro(): Promise<MacroData> {
  return fetchJSON<MacroData>(`${BASE}/macro`);
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

export async function fetchCompositeBatch(
  symbols: string[],
  interval = "Daily"
): Promise<CompositeBatchResponse> {
  if (!symbols.length) return { scores: {}, errors: [] };

  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += COMPOSITE_BATCH_MAX_SYMBOLS) {
    chunks.push(symbols.slice(i, i + COMPOSITE_BATCH_MAX_SYMBOLS));
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

// ---- P/E feed freshness ----

export interface PEFeedStatus {
  last_successful_fetch: string | null;
  last_attempt_status: string | null;
}

export async function fetchPEFeedStatus(): Promise<PEFeedStatus> {
  const data = await fetchJSON<{
    last_successful_fetch: string | null;
    last_attempt_status: string | null;
  }>(`${BASE}/pe`);
  return {
    last_successful_fetch: data.last_successful_fetch ?? null,
    last_attempt_status: data.last_attempt_status ?? null,
  };
}

// ---- User administration (admin only) ----

export interface ManagedUser {
  id: string;
  username: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;
  holdings_count: number;
}

/**
 * `generated_password` is populated ONLY when the backend generated one, and
 * only on the response to the call that created it. It is never readable again.
 */
export interface PasswordResult {
  generated_password: string | null;
}

export async function fetchUsers(): Promise<{ users: ManagedUser[] }> {
  return fetchJSON<{ users: ManagedUser[] }>(`${BASE}/users`);
}

export async function createUser(
  username: string,
  password?: string
): Promise<{ user: ManagedUser } & PasswordResult> {
  return fetchJSON(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: password || null }),
  });
}

export async function resetUserPassword(
  id: string,
  password?: string
): Promise<{ id: string; username: string } & PasswordResult> {
  return fetchJSON(`${BASE}/users/${encodeURIComponent(id)}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: password || null }),
  });
}

export async function setUserActive(
  id: string,
  isActive: boolean
): Promise<ManagedUser> {
  return fetchJSON<ManagedUser>(`${BASE}/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function deleteUser(
  id: string
): Promise<{ deleted: string; username: string }> {
  return fetchJSON(`${BASE}/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// ---- Market condition reading ----

export interface MarketRegime {
  mean_score: number | null;
  n_symbols: number;
  band: "weak" | "mixed" | "broad" | null;
  label: string;
  summary: string;
  horizon_days: number;
  hist_median_3m_pct?: number;
  hist_positive_rate?: number;
  observations?: number;
  /**
   * Strength of the association behind the bands, on the OVERLAPPING sample.
   * Was 0.318 until 2026-09-02 — that figure was one of three de-overlapped
   * phases (the others gave 0.180 and 0.004) and must not come back. See the
   * correction note in egx-api-be/app/core/regime.py.
   */
  association_rho?: number;
  /** Newey-West t, corrected for the overlap. Below 1.96 = not significant. */
  association_t?: number;
  /** Readings behind association_rho. These OVERLAP — they are not independent. */
  association_n?: number;
  /** False today. When false the UI must present this card as context only. */
  association_significant?: boolean;
  /** All three de-overlapped phases, so no single one can be quoted as "the" number. */
  association_phase_rhos?: number[];
  universe_size?: number;
  stale?: boolean;
  observed_at?: string;
  n_symbols_now?: number;
}

// ---- Calibration: the app's own accuracy record ----

export interface CalibrationBand {
  claim: string;
  promised_pct: number;
  delivered_pct: number;
  note: string | null;
}

export interface CalibrationResponse {
  forecast: {
    fitted_at: string;
    n_observations: number;
    universe: string;
    bands: CalibrationBand[];
    /** Coverage alone is gameable — a band from 0 to infinity covers 100%. */
    sharpness: {
      median_width_pct_of_spot: number;
      p25: number;
      p75: number;
      note: string;
    };
    z_table: Record<string, number>;
  };
  risk_grade: {
    fitted_at: string;
    n_observations: number;
    claims: {
      claim: string;
      ic: number;
      t_non_overlapping: number;
      verdict: string;
    }[];
  };
  /** Reported beside the successes on purpose. */
  what_failed: { claim: string; measured: string; outcome: string }[];
}

export async function fetchCalibration(): Promise<CalibrationResponse> {
  return fetchJSON<CalibrationResponse>(`${BASE}/calibration`);
}

// ---- Per-stock risk grade ----

/**
 * What a volatility quintile HISTORICALLY went on to do over the next ~6 months.
 * Medians, not means: EGX forward outcomes are heavily right-skewed and a mean
 * describes a distribution nobody experiences.
 *
 * Note what is absent and must stay absent — any return figure. Volatility
 * predicts volatility and drawdown with real skill; it does not tell you which
 * way the price goes.
 */
export interface RiskHistorical {
  future_vol_ann_pct: number;
  median_max_drawdown_pct: number;
  p90_max_drawdown_pct: number;
}

export interface RiskRow {
  symbol: string;
  measured_at: string;
  /** Trailing 63-day sigma, annualized. The input the quintiles were fitted on. */
  sigma_63_ann_pct: number | null;
  /** EWMA(0.94). Forecasts better, but is NOT what the ranking uses. */
  sigma_ewma_ann_pct: number | null;
  beta: number | null;
  turnover_egp: number | null;
  traded_share: number | null;
  last_price: number | null;
  tradeable: boolean | null;
  /** Null for untradeable symbols — a rank they have not earned. */
  pct_rank: number | null;
  quintile: number | null;
  band: "calm" | "steady" | "average" | "jumpy" | "wild" | null;
  band_label?: string;
  historical?: RiskHistorical;
}

export interface RiskResponse {
  data: RiskRow[];
  n_symbols: number;
  n_ranked?: number;
  /** The STALEST row, not the freshest — a snapshot is only as current as that. */
  oldest_measurement?: string | null;
  newest_measurement?: string | null;
  liquidity_floor_egp?: number;
  calibration?: {
    fitted_at: string;
    n_observations: number;
    n_symbols: number;
    lookback_days: number;
    forward_days: number;
    vol_predicts_vol_ic: number;
    vol_predicts_drawdown_ic: number;
  };
  symbol?: string;
  note?: string;
}

export async function fetchRisk(symbol?: string): Promise<RiskResponse> {
  const q = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
  return fetchJSON<RiskResponse>(`${BASE}/risk${q}`);
}

export async function fetchMarketRegime(): Promise<MarketRegime> {
  return fetchJSON<MarketRegime>(`${BASE}/market_regime`);
}
