// ============================================================
// Ticker data
// ============================================================

export interface Ticker {
  symbol: string;
  name: string;
  sector: string;
  index: string; // EGX30, EGX70, EGX100, NILEX
}

// ============================================================
// OHLCV data
// ============================================================

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVResponse {
  symbol: string;
  interval: string;
  data: OHLCVBar[];
}

// ============================================================
// Analysis (technical indicators)
// ============================================================

export interface AnalysisIndicators {
  sma_20: (number | null)[];
  sma_50: (number | null)[];
  sma_200: (number | null)[];
  ema_12: (number | null)[];
  ema_26: (number | null)[];
  rsi: (number | null)[];
  macd_line: (number | null)[];
  macd_signal: (number | null)[];
  macd_histogram: (number | null)[];
  bollinger_upper: (number | null)[];
  bollinger_middle: (number | null)[];
  bollinger_lower: (number | null)[];
  daily_returns: (number | null)[];
  volatility: (number | null)[];
  cumulative_returns: (number | null)[];
  atr: (number | null)[];
  obv: (number | null)[];
  stochastic_k: (number | null)[];
  stochastic_d: (number | null)[];
  adx: (number | null)[];
  plus_di: (number | null)[];
  minus_di: (number | null)[];
  mfi: (number | null)[];
}

export interface AnalysisOHLCV {
  dates: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export interface AnalysisStats {
  current_price: number;
  previous_close: number | null;
  change: number;
  change_pct: number;
  high_52w: number;
  low_52w: number;
  avg_volume: number;
}

export interface SupportLevel {
  price: number;
  strength: number;
}

export interface SupportResistance {
  supports: SupportLevel[];
  resistances: SupportLevel[];
}

export interface FibonacciLevels {
  high: number;
  low: number;
  levels: Record<string, number>;
}

export interface CrossoverInfo {
  golden_cross: string | null;
  death_cross: string | null;
  current_signal: "golden_cross" | "death_cross" | null;
  days_since_cross: number | null;
}

export interface DivergenceInfo {
  bullish: boolean;
  bearish: boolean;
  hidden_bullish: boolean;
  hidden_bearish: boolean;
  detail: string | null;
}

export interface Divergences {
  rsi: DivergenceInfo;
  macd: DivergenceInfo;
}

export interface VolumePriceInfo {
  classification: string; // "confirmed_up" | "confirmed_down" | "unconfirmed_up" | "unconfirmed_down" | "accumulation" | "quiet" | "normal"
  price_change_pct: number;
  volume_ratio: number;
}

export interface MultiTimeframe {
  daily_trend: "up" | "down" | "sideways";
  weekly_trend: "up" | "down" | "sideways";
  aligned: boolean;
  alignment_score: number;
}

// ============================================================
// Key levels + entry/exit zones
// ============================================================

export interface NearestLevel {
  price: number;
  /** Signed: negative when level is below current price, positive when above. */
  distance_pct: number;
  strength: number;
}

export interface KeyLevels {
  current_price: number;
  nearest_support: NearestLevel | null;
  nearest_resistance: NearestLevel | null;
  room_to_support_pct: number | null;
  room_to_resistance_pct: number | null;
}

export type ZoneConfidence = "low" | "medium" | "high";

export interface EntryZone {
  active: boolean;
  confidence: ZoneConfidence | null;
  price_range: { low: number; high: number } | null;
  suggested_stop_loss: number | null;
  reasons: string[];
}

export interface ExitZone {
  active: boolean;
  confidence: ZoneConfidence | null;
  price_range: { low: number; high: number } | null;
  reasons: string[];
}

export interface EntryExit {
  entry_zone: EntryZone;
  exit_zone: ExitZone;
}

export type CompositeSignal =
  | "Strong Sell"
  | "Sell"
  | "Hold"
  | "Buy"
  | "Strong Buy";

export interface CategoryScore {
  score: number | null;
  weight: number;
  effective_weight: number;
  weighted_contribution: number;
  reasons: string[];
}

export interface CompositeScore {
  score: number;
  signal: CompositeSignal;
  categories: {
    trend: CategoryScore;
    momentum: CategoryScore;
    volume: CategoryScore;
    volatility: CategoryScore;
    divergence: CategoryScore;
    // New categories — optional for backwards compat with older backends
    quality?: CategoryScore | null;
    risk_adjusted?: CategoryScore | null;
    relative_strength?: CategoryScore | null;
  };
  weights: Record<string, number>;
  // Macro modulation delta (signed) and human-readable note, when EGX30 regime
  // affected the final score. Null when macro data is unavailable or neutral.
  macro_adjustment?: number | null;
  macro_context?: string | null;
}

export interface ScoreWeights {
  trend: number;
  momentum: number;
  volume: number;
  volatility: number;
  divergence: number;
  quality: number;
  risk_adjusted: number;
  relative_strength: number;
}

export interface AnalysisResponse {
  symbol: string;
  interval: string;
  bars: number;
  ohlcv: AnalysisOHLCV;
  indicators: AnalysisIndicators;
  stats: AnalysisStats;
  beta: number | null;
  support_resistance: SupportResistance;
  fibonacci: FibonacciLevels;
  crossovers: CrossoverInfo;
  composite_score: CompositeScore;
  divergences: Divergences;
  volume_price: VolumePriceInfo;
  multi_timeframe: MultiTimeframe | null;
  bb_squeeze: boolean;
  key_levels?: KeyLevels | null;
  entry_exit?: EntryExit | null;
}

// ============================================================
// Historical / Comparison
// ============================================================

export interface HistoricalResponse {
  symbols: string[];
  dates: string[];
  [symbol: string]: string[] | number[] | undefined;
}

export interface CompareStats {
  total_return: number;
  volatility: number;
  max_drawdown: number;
}

export interface CompareResponse {
  symbols: string[];
  dates: string[];
  stats: Record<string, CompareStats>;
  [symbol: string]: string[] | number[] | Record<string, CompareStats> | undefined;
}

// ============================================================
// Portfolio
// ============================================================

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  buy_price: number;
  buy_date: string;
  quantity: number;
  notes: string;
  sector: string;
  target_price: number | null;
  stop_loss: number | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  portfolio: PortfolioHolding[];
  currency: string;
}

export interface HoldingAnalysis {
  id?: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  buy_price: number;
  buy_date: string;
  current_price: number;
  current_value: number;
  invested: number;
  pnl: number;
  pnl_pct: number;
  days_held: number;
  annualized_return: number;
  rsi: number | null;
  sma_50: number | null;
  above_sma: boolean | null;
  sma_200?: number | null;
  volatility: number | null;
  volume_trend: string;
  target_price: number | null;
  stop_loss: number | null;
  dist_to_target: number | null;
  dist_to_stop: number | null;
  beta: number | null;
  atr: number | null;
  atr_pct: number | null;
  obv_trend: string | null;
  stochastic_k: number | null;
  stochastic_d: number | null;
  supports: SupportLevel[];
  resistances: SupportLevel[];
  fibonacci: FibonacciLevels;
  trend: string | null;
  golden_cross_active: boolean;
  adx?: number | null;
  plus_di?: number | null;
  minus_di?: number | null;
  mfi?: number | null;
  divergences?: Divergences;
  volume_price?: VolumePriceInfo;
  composite_score: number | null;
  composite_signal: CompositeSignal | null;
  composite_breakdown?: CompositeScore["categories"] | null;
  key_levels?: KeyLevels | null;
  entry_exit?: EntryExit | null;
  error?: string;
}

export interface Signal {
  type: string;
  severity: "action_required" | "warning" | "opportunity" | "info";
  symbol: string | null;
  message: string;
  explanation: string;
  learn_concept?: string;
}

export interface MaxDrawdownInfo {
  value: number;
  peak_date: string | null;
  trough_date: string | null;
  current_drawdown: number;
}

export interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

export interface MonteCarloResult {
  days: number;
  initial_value: number;
  probability_of_loss: number;
  worst_case_5pct: number;
  pessimistic_25pct: number;
  median: number;
  optimistic_75pct: number;
  best_case_95pct: number;
  percentiles: {
    p5: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p95: number[];
  };
}

export interface MacroIndicator {
  value: number | null;
  change_pct?: number | null;
  direction: string | null;
  trend?: string | null;
  monthly_change_pct?: number | null;
}

export interface MacroData {
  egx30: MacroIndicator;
  usd_egp: MacroIndicator;
  interest_rate: MacroIndicator;
}

export interface PortfolioMetrics {
  total_value: number;
  total_invested: number;
  total_current_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  sector_allocation: Record<string, number>;
  stock_concentration: Record<string, number>;
  diversification_score: number;
  weighted_rsi: number | null;
  num_holdings: number;
  avg_composite_score: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  max_drawdown: MaxDrawdownInfo | null;
  var_95_pct: number | null;
  var_95_egp: number | null;
  cvar_95_pct: number | null;
  cvar_95_egp: number | null;
  avg_correlation: number | null;
}

export interface PortfolioAnalysisResponse {
  holdings: HoldingAnalysis[];
  portfolio_metrics: PortfolioMetrics;
  correlation_matrix: CorrelationMatrix | null;
  monte_carlo: MonteCarloResult | null;
  macro: MacroData | null;
  signals: Signal[];
  disclaimer: string;
}
