"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import PriceChart from "../../components/PriceChart";
import VolumeChart from "../../components/VolumeChart";
import IndicatorPanel from "../../components/IndicatorPanel";
import StatsPanel from "../../components/StatsPanel";
import CompositeGauge from "../../components/CompositeGauge";
import ScoreBreakdown from "../../components/ScoreBreakdown";
import KeyLevelsCard from "../../components/KeyLevelsCard";
import EntryExitCard from "../../components/EntryExitCard";
import PEFreshnessBanner from "../../components/PEFreshnessBanner";
import { useWatchlist } from "../../components/Watchlist";
import { useScoreWeights } from "../../components/ScoreWeightsProvider";
import { ChartSkeleton } from "../../components/LoadingSkeleton";
import LearnTooltip from "../../components/LearnTooltip";
import { fetchAnalysis } from "../../lib/api";
import { SR_LEVELS_DISPLAYED } from "../../lib/constants";
import type { AnalysisResponse } from "../../lib/types";

const INTERVALS = ["Daily", "Weekly", "Monthly"];
const BAR_COUNTS = [60, 100, 200, 500];

export default function StockDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const symbol = (params.symbol as string).toUpperCase();
  const { add, remove, has } = useWatchlist();

  // Dashboard cards pass ?interval=Weekly|Monthly so scores match the card
  const initialInterval = (() => {
    const q = searchParams.get("interval");
    return q && INTERVALS.includes(q) ? q : "Daily";
  })();

  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState(initialInterval);
  const [bars, setBars] = useState(200);
  const [overlays, setOverlays] = useState({
    sma20: true,
    sma50: false,
    sma200: false,
    ema12: false,
    ema26: false,
    bollinger: false,
  });
  const [showIndicators, setShowIndicators] = useState(false);

  const isWatched = has(symbol);
  const { version: weightsVersion } = useScoreWeights();

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchAnalysis(symbol, interval, bars)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [symbol, interval, bars, weightsVersion]);

  // Build chart data arrays
  const priceChartData = useMemo(() => {
    if (!data) return [];
    return data.ohlcv.dates.map((date, i) => ({
      date,
      close: data.ohlcv.close[i],
      open: data.ohlcv.open[i],
      high: data.ohlcv.high[i],
      low: data.ohlcv.low[i],
      sma_20: data.indicators.sma_20[i],
      sma_50: data.indicators.sma_50[i],
      sma_200: data.indicators.sma_200[i],
      ema_12: data.indicators.ema_12[i],
      ema_26: data.indicators.ema_26[i],
      bollinger_upper: data.indicators.bollinger_upper[i],
      bollinger_middle: data.indicators.bollinger_middle[i],
      bollinger_lower: data.indicators.bollinger_lower[i],
    }));
  }, [data]);

  const volumeChartData = useMemo(() => {
    if (!data) return [];
    return data.ohlcv.dates.map((date, i) => ({
      date,
      volume: data.ohlcv.volume[i],
      close: data.ohlcv.close[i],
      open: data.ohlcv.open[i],
    }));
  }, [data]);

  const indicatorData = useMemo(() => {
    if (!data) return [];
    return data.ohlcv.dates.map((date, i) => ({
      date,
      rsi: data.indicators.rsi[i],
      macd_line: data.indicators.macd_line[i],
      macd_signal: data.indicators.macd_signal[i],
      macd_histogram: data.indicators.macd_histogram[i],
      stochastic_k: data.indicators.stochastic_k[i],
      stochastic_d: data.indicators.stochastic_d[i],
      obv: data.indicators.obv[i],
    }));
  }, [data]);

  const latestRsi = data?.indicators.rsi.filter((v) => v != null).pop() ?? null;
  const latestVol = data?.indicators.volatility.filter((v) => v != null).pop() ?? null;
  const latestCumReturn = data?.indicators.cumulative_returns.filter((v) => v != null).pop() ?? null;
  const latestAtr = data?.indicators.atr.filter((v) => v != null).pop() ?? null;
  const latestAtrPct = (latestAtr && data?.stats.current_price)
    ? Math.round(latestAtr / data.stats.current_price * 1000) / 10
    : null;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Sticky header with price — visible on scroll */}
        <div className="sticky top-[56px] z-30 -mx-4 mb-4 flex items-center justify-between bg-charcoal-dark/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:mb-6 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">{symbol}</h1>
            {data && (
              <p className="mt-0.5 text-xs text-white/40 md:mt-1 md:text-sm">
                {data.interval} &middot; {data.bars} bars
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => (isWatched ? remove(symbol) : add(symbol))}
              className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isWatched
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-white/10 text-white/50 hover:text-accent"
              }`}
            >
              {isWatched ? "Watching" : "Watch"}
            </button>
          </div>
        </div>

        {/* Controls — scrollable pills on mobile */}
        <div className="mb-4 space-y-2 overflow-x-auto no-scrollbar md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="flex gap-1.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  interval === iv
                    ? "bg-accent/20 text-accent"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {iv}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {BAR_COUNTS.map((b) => (
              <button
                key={b}
                onClick={() => setBars(b)}
                className={`min-h-[36px] whitespace-nowrap rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${
                  bars === b
                    ? "bg-white/10 text-white"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Overlay toggles */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar border-l border-white/10 pl-3 md:flex-wrap md:overflow-visible">
            {[
              { key: "sma20" as const, label: "SMA 20", color: "#ffaa00" },
              { key: "sma50" as const, label: "SMA 50", color: "#ff6600" },
              { key: "sma200" as const, label: "SMA 200", color: "#ff0066" },
              { key: "ema12" as const, label: "EMA 12", color: "#00ccff" },
              { key: "ema26" as const, label: "EMA 26", color: "#cc00ff" },
              { key: "bollinger" as const, label: "Bollinger", color: "#4488ff" },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() =>
                  setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
                }
                className={`min-h-[32px] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  overlays[key]
                    ? "bg-white/10"
                    : "text-white/30 hover:text-white/50"
                }`}
                style={{ color: overlays[key] ? color : undefined }}
              >
                <LearnTooltip
                  term={label}
                  explanation={
                    key === "sma200"
                      ? "200-day SMA — the most important long-term trend indicator. Used for Golden Cross / Death Cross signals."
                      : key.startsWith("sma")
                      ? `Simple Moving Average (${label.split(" ")[1]}-day). Shows the average price over the period. Price above SMA = bullish trend.`
                      : key.startsWith("ema")
                        ? `Exponential Moving Average (${label.split(" ")[1]}-day). Like SMA but reacts faster to recent price changes.`
                        : "Bollinger Bands show volatility. When bands squeeze = big move coming. Price at upper band = possibly overbought."
                  }
                >
                  <span>{label}</span>
                </LearnTooltip>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <ChartSkeleton height="h-96" />
            <ChartSkeleton height="h-32" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-loss/20 bg-loss/5 p-8 text-center">
            <p className="text-sm text-loss">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchAnalysis(symbol, interval, bars)
                  .then((d) => {
                    setData(d);
                    setLoading(false);
                  })
                  .catch((e) => {
                    setError(e.message);
                    setLoading(false);
                  });
              }}
              className="mt-3 rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/50 hover:text-white"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 space-y-4">
              <PEFreshnessBanner />
              {/* Key Statistics first on mobile; desktop keeps them in the right sidebar below */}
              <div className="lg:hidden">
                <StatsPanel
                  stats={data.stats}
                  latestRsi={latestRsi}
                  latestVolatility={latestVol}
                  cumulativeReturn={latestCumReturn}
                  beta={data.beta}
                  atr={latestAtr}
                  atrPct={latestAtrPct}
                  crossovers={data.crossovers}
                  pe={data.pe}
                />
              </div>

              {/* Composite Score Card */}
              {data.composite_score && (
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-4 md:p-5">
                  <div className="grid md:grid-cols-[auto,1fr] gap-4 md:gap-6 items-start">
                    <div className="flex flex-col items-center md:items-start gap-2">
                      <CompositeGauge
                        score={data.composite_score.score}
                        signal={data.composite_score.signal}
                        size="lg"
                      />
                      <div className="text-center md:text-left">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">
                          Composite Signal
                        </div>
                        <div
                          className="font-mono text-base font-semibold"
                          style={{
                            color:
                              data.composite_score.score >= 60
                                ? "#00ff88"
                                : data.composite_score.score <= 40
                                ? "#ff3355"
                                : "#ffaa00",
                          }}
                        >
                          {data.composite_score.signal}
                        </div>
                      </div>
                    </div>
                    <ScoreBreakdown composite={data.composite_score} />
                  </div>

                  {/* Divergence + Multi-timeframe callout */}
                  {(data.divergences || data.multi_timeframe || data.bb_squeeze) && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2 text-[11px]">
                      {data.divergences?.rsi?.bullish && (
                        <span className="rounded-full bg-gain/10 text-gain px-2.5 py-1">
                          🔄 RSI bullish divergence
                        </span>
                      )}
                      {data.divergences?.rsi?.bearish && (
                        <span className="rounded-full bg-loss/10 text-loss px-2.5 py-1">
                          🔄 RSI bearish divergence
                        </span>
                      )}
                      {data.divergences?.macd?.bullish && (
                        <span className="rounded-full bg-gain/10 text-gain px-2.5 py-1">
                          🔄 MACD bullish divergence
                        </span>
                      )}
                      {data.divergences?.macd?.bearish && (
                        <span className="rounded-full bg-loss/10 text-loss px-2.5 py-1">
                          🔄 MACD bearish divergence
                        </span>
                      )}
                      {data.multi_timeframe?.aligned && (
                        <span className="rounded-full bg-accent/10 text-accent px-2.5 py-1">
                          ✅ Daily + Weekly aligned ({data.multi_timeframe.daily_trend})
                        </span>
                      )}
                      {data.multi_timeframe &&
                        !data.multi_timeframe.aligned &&
                        data.multi_timeframe.daily_trend !== "sideways" &&
                        data.multi_timeframe.weekly_trend !== "sideways" && (
                          <span className="rounded-full bg-white/5 text-white/60 px-2.5 py-1">
                            ⚠️ Daily {data.multi_timeframe.daily_trend} vs Weekly{" "}
                            {data.multi_timeframe.weekly_trend} — mixed signals
                          </span>
                        )}
                      {data.bb_squeeze && (
                        <span className="rounded-full bg-accent/10 text-accent px-2.5 py-1">
                          🔔 Bollinger squeeze — breakout likely
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Key levels + entry/exit zones — stacked on mobile, side-by-side on desktop */}
              {(data.key_levels || data.entry_exit) && (
                <div className="grid gap-4 md:grid-cols-2">
                  <KeyLevelsCard keyLevels={data.key_levels} />
                  <EntryExitCard entryExit={data.entry_exit} />
                </div>
              )}

              <div className="min-h-[250px]">
                <PriceChart
                  data={priceChartData}
                  overlays={overlays}
                  supports={data.support_resistance?.supports?.slice(0, SR_LEVELS_DISPLAYED)}
                  resistances={data.support_resistance?.resistances?.slice(0, SR_LEVELS_DISPLAYED)}
                  fibonacci={data.fibonacci}
                  height={400}
                />
              </div>
              <VolumeChart data={volumeChartData} />

              {/* Collapsible indicators on mobile */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowIndicators(!showIndicators)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <span className="text-sm font-medium text-white/70">Technical Indicators</span>
                  <span className="text-xs text-white/40">{showIndicators ? "Hide" : "Show"}</span>
                </button>
                {showIndicators && (
                  <div className="mt-2">
                    <IndicatorPanel data={indicatorData} />
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <IndicatorPanel data={indicatorData} />
              </div>
            </div>

            <div className="hidden lg:block lg:w-72">
              <StatsPanel
                stats={data.stats}
                latestRsi={latestRsi}
                latestVolatility={latestVol}
                cumulativeReturn={latestCumReturn}
                beta={data.beta}
                atr={latestAtr}
                atrPct={latestAtrPct}
                crossovers={data.crossovers}
                pe={data.pe}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
