"use client";

import { useState, useMemo } from "react";
import CompareChart from "../components/CompareChart";
import { ChartSkeleton } from "../components/LoadingSkeleton";
import LearnTooltip from "../components/LearnTooltip";
import { useTickers } from "../components/TickersProvider";
import { fetchComparison } from "../lib/api";
import {
  COMPARE_DEFAULT_LOOKBACK_MONTHS,
  COMPARE_SUGGESTIONS_LIMIT,
  MAX_COMPARE_SYMBOLS,
  MIN_COMPARE_SYMBOLS,
} from "../lib/constants";
import type { CompareResponse } from "../lib/types";

export default function ComparePage() {
  const { tickers } = useTickers();
  const [selected, setSelected] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - COMPARE_DEFAULT_LOOKBACK_MONTHS);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!input) return [];
    const q = input.toLowerCase();
    return tickers
      .filter(
        (t) =>
          !selected.includes(t.symbol) &&
          (t.symbol.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q))
      )
      .slice(0, COMPARE_SUGGESTIONS_LIMIT);
  }, [input, tickers, selected]);

  const addSymbol = (sym: string) => {
    if (selected.length >= MAX_COMPARE_SYMBOLS) return;
    if (!selected.includes(sym)) {
      setSelected([...selected, sym]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeSymbol = (sym: string) => {
    setSelected(selected.filter((s) => s !== sym));
  };

  const compare = () => {
    if (selected.length < MIN_COMPARE_SYMBOLS) return;
    setLoading(true);
    setError(null);

    fetchComparison(selected, "Daily", start, end)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  const series = useMemo(() => {
    if (!data) return [];
    return selected
      .filter((sym) => data[sym])
      .map((sym) => ({
        symbol: sym,
        values: data[sym] as number[],
      }));
  }, [data, selected]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold text-white">Compare Stocks</h1>
        <p className="mb-6 text-sm text-white/40">
          Select 2-5 stocks to compare their performance over time.
        </p>

        {/* Selection controls */}
        <div className="mb-6 space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Selected chips */}
            {selected.map((sym) => (
              <span
                key={sym}
                className="flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1"
              >
                <span className="font-mono text-xs font-medium text-accent">
                  {sym}
                </span>
                <button
                  onClick={() => removeSymbol(sym)}
                  className="text-xs text-accent/50 hover:text-accent"
                >
                  x
                </button>
              </span>
            ))}

            {/* Add input */}
            {selected.length < MAX_COMPARE_SYMBOLS && (
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && suggestions.length > 0) {
                      addSymbol(suggestions[0].symbol);
                    }
                  }}
                  placeholder="Add symbol..."
                  className="w-36 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white placeholder-white/30 outline-none focus:border-accent/50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-white/10 bg-charcoal shadow-xl">
                    {suggestions.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => addSymbol(t.symbol)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5"
                      >
                        <span className="font-mono text-xs text-white">
                          {t.symbol}
                        </span>
                        <span className="text-[10px] text-white/40 line-clamp-1">
                          {t.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date range */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40">From</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 sm:flex-none sm:py-1.5 sm:text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/40">To</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/50 sm:flex-none sm:py-1.5 sm:text-xs"
              />
            </div>
            <button
              onClick={compare}
              disabled={selected.length < MIN_COMPARE_SYMBOLS || loading}
              className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-charcoal-dark transition-opacity hover:opacity-90 disabled:opacity-30 sm:min-h-0 sm:py-1.5 sm:text-xs"
            >
              {loading ? "Loading..." : "Compare"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-loss/20 bg-loss/5 p-4 text-sm text-loss">
            {error}
          </div>
        )}

        {loading ? (
          <ChartSkeleton height="h-96" />
        ) : data ? (
          <div className="space-y-6">
            <CompareChart
              dates={data.dates}
              series={series}
              height={400}
            />

            {/* Stats — cards on mobile, table on desktop */}
            {data.stats && Object.keys(data.stats).length > 0 && (
              <>
                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {Object.entries(data.stats).map(([sym, stats]) => (
                    <div key={sym} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <p className="mb-2 font-mono text-sm font-medium text-white">{sym}</p>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-white/40">Return</p>
                          <p className={`font-mono font-medium ${stats.total_return >= 0 ? "text-gain" : "text-loss"}`}>
                            {stats.total_return >= 0 ? "+" : ""}{stats.total_return.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-white/40">Volatility</p>
                          <p className="font-mono text-white/60">{(stats.volatility * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-white/40">Max DD</p>
                          <p className="font-mono text-loss">{stats.max_drawdown.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[11px] text-white/40">
                        <th className="px-4 py-3 font-medium">Symbol</th>
                        <th className="px-4 py-3 font-medium">
                          <LearnTooltip
                            term="Total Return"
                            explanation="The total percentage gain or loss over the selected period. Calculated as (end_price / start_price - 1) * 100."
                          >
                            <span>Total Return</span>
                          </LearnTooltip>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <LearnTooltip
                            term="Volatility"
                            explanation="Standard deviation of daily returns. Higher = more price swings = more risk. Lower = calmer price action."
                          >
                            <span>Volatility</span>
                          </LearnTooltip>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <LearnTooltip
                            term="Max Drawdown"
                            explanation="The worst peak-to-trough decline during the period. If max drawdown is -20%, the stock fell 20% from its highest point. Shows the worst-case loss scenario."
                          >
                            <span>Max Drawdown</span>
                          </LearnTooltip>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.stats).map(([sym, stats]) => (
                        <tr
                          key={sym}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium text-white">
                            {sym}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono text-xs font-medium ${
                              stats.total_return >= 0 ? "text-gain" : "text-loss"
                            }`}
                          >
                            {stats.total_return >= 0 ? "+" : ""}
                            {stats.total_return.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-white/60">
                            {(stats.volatility * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-loss">
                            {stats.max_drawdown.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] p-16">
            <p className="text-sm text-white/30">
              Select at least 2 stocks and click Compare to see results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
