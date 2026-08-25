/**
 * Centralized tuning knobs and thresholds for the EGX frontend.
 *
 * What lives here: behavioral values that are referenced from multiple
 * files, control progressive-loading / batching cadence, or are likely
 * to be tuned. What does NOT live here: Tailwind classes, chart pixel
 * dimensions, design tokens, and one-off layout literals — those stay
 * with the JSX they style.
 */

import type { ScoreWeights } from "./types";

// === Dashboard ===

/** Cards shown per page on the dashboard; "Load More" reveals the next batch. */
export const CARDS_PER_PAGE = 24;

/** Symbols fetched per progressive composite/price chunk so the UI streams in. */
export const DASHBOARD_FETCH_CHUNK_SIZE = 2;

/** Delay (ms) before retrying symbols the backend reported as upstream-timeout. */
export const COMPOSITE_RETRY_DELAY_MS = 4000;

// === API ===

/** Max symbols sent in one batched composite request to the backend. */
export const COMPOSITE_BATCH_MAX_SYMBOLS = 6;

// === Forms ===

/** Max ticker suggestions in the holdings autocomplete dropdown. */
export const TICKER_SEARCH_LIMIT = 10;

/** Debounce (ms) before validating ticker input against the API. */
export const TICKER_VALIDATION_DEBOUNCE_MS = 600;

// === Compare page ===

/** Max stocks the compare page accepts in one comparison. */
export const MAX_COMPARE_SYMBOLS = 5;

/** Min stocks required before the Compare button activates. */
export const MIN_COMPARE_SYMBOLS = 2;

/** Max suggestions shown in the compare-page ticker autocomplete. */
export const COMPARE_SUGGESTIONS_LIMIT = 8;

/** Default lookback window (months) when the compare page first loads. */
export const COMPARE_DEFAULT_LOOKBACK_MONTHS = 6;

// === Charts ===

/** Top-N support and resistance lines drawn on the price chart. */
export const SR_LEVELS_DISPLAYED = 3;

// === Composite Score thresholds ===
// Bands are HALF-OPEN with the LOWER bound inclusive, exactly matching
// `classify_signal` in egx-api-be/app/core/composite.py:
//
//   Strong Sell  < 20        Sell  20–39.99      Hold  40–59.99
//   Buy          60–79.99    Strong Buy  ≥ 80
//
// The names read as "max" for historical reasons but each value is really
// the MINIMUM of the band above it. Using `<=` against them (as the gauge
// once did) shifts every band down by one: a score of exactly 60 would
// render Hold-amber while its badge said BUY.
// Keep in sync with SCORE_*_MAX in egx-api-be/app/core/constants.py.

export const SCORE_STRONG_SELL_MAX = 20;
export const SCORE_SELL_MAX = 40;
export const SCORE_HOLD_MAX = 60;
export const SCORE_BUY_MAX = 80;

export type ScoreBand = "strong_sell" | "sell" | "hold" | "buy" | "strong_buy";

/**
 * The one place a score becomes a band. Every colour, label and style in
 * the app derives from this so they cannot disagree at a boundary.
 * Mirrors the backend's `>=` comparison order.
 */
export function scoreBand(score: number): ScoreBand {
  if (score >= SCORE_BUY_MAX) return "strong_buy";
  if (score >= SCORE_HOLD_MAX) return "buy";
  if (score >= SCORE_SELL_MAX) return "hold";
  if (score >= SCORE_STRONG_SELL_MAX) return "sell";
  return "strong_sell";
}

/** Human-readable label per band — matches the backend `signal` string. */
export const SCORE_BAND_LABEL: Record<ScoreBand, string> = {
  strong_sell: "Strong Sell",
  sell: "Sell",
  hold: "Hold",
  buy: "Buy",
  strong_buy: "Strong Buy",
};

// === Risk dashboard thresholds ===

/** Sharpe ≥ this is "good" given Egypt's ~25% risk-free rate. */
export const SHARPE_GOOD = 1;
/** Sharpe between 0 and this is marginal. */
export const SHARPE_OKAY = 0.5;

/** Max drawdown shallower than this (i.e., > -10%) is acceptable. */
export const DD_GOOD = -0.1;
/** Max drawdown between -10% and -20% is the caution zone. */
export const DD_CAUTION = -0.2;

/** Current drawdown shallower than this is treated as "at peak". */
export const CURRENT_DD_NEUTRAL = -0.01;
/** Current drawdown between -1% and -5% is the caution zone. */
export const CURRENT_DD_CAUTION = -0.05;

// === Score weights — fallback presets ===
// Used by ScoreWeightsProvider before the first /api/weights fetch
// completes; the endpoint may override these at runtime.
export const FALLBACK_WEIGHT_PRESETS: Record<string, ScoreWeights> = {
  beginner_safe:    { trend: 18, momentum: 15, volume: 12, volatility: 10, divergence: 8,  quality: 12, risk_adjusted: 13, relative_strength: 12 },
  balanced:         { trend: 14, momentum: 13, volume: 12, volatility: 12, divergence: 12, quality: 12, risk_adjusted: 12, relative_strength: 13 },
  trend_follower:   { trend: 30, momentum: 15, volume: 10, volatility: 8,  divergence: 2,  quality: 15, risk_adjusted: 5,  relative_strength: 15 },
  reversal_hunter:  { trend: 10, momentum: 20, volume: 15, volatility: 15, divergence: 25, quality: 5,  risk_adjusted: 5,  relative_strength: 5  },
  income_defensive: { trend: 15, momentum: 8,  volume: 10, volatility: 15, divergence: 2,  quality: 20, risk_adjusted: 25, relative_strength: 5  },
};

/** Default weight set when no user preference exists — matches backend "Beginner Safe". */
export const DEFAULT_WEIGHTS: ScoreWeights = FALLBACK_WEIGHT_PRESETS.beginner_safe;

// === Service worker ===

/** Bump this version string to invalidate the cached app shell on next load.
 *  IMPORTANT: keep in sync with `CACHE_NAME` literal in public/sw.js
 *  (sw.js is served raw and cannot import this module). */
export const SW_CACHE_NAME = "egx-v2";
