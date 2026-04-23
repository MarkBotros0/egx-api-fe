"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import StockCard from "./components/StockCard";
import IndexFilter from "./components/IndexFilter";
import SectorFilter from "./components/SectorFilter";
import WatchlistPanel, { useWatchlist } from "./components/Watchlist";
import { useTickers } from "./components/TickersProvider";
import { CardSkeleton } from "./components/LoadingSkeleton";
import LearnTooltip from "./components/LearnTooltip";
import { useScoreWeights } from "./components/ScoreWeightsProvider";
import { fetchCompositeBatch } from "./lib/api";
import {
  CARDS_PER_PAGE,
  COMPOSITE_RETRY_DELAY_MS,
  DASHBOARD_FETCH_CHUNK_SIZE,
} from "./lib/constants";
import type { Ticker, CompositeSignal } from "./lib/types";

const COMPOSITE_INTERVALS = ["Daily", "Weekly", "Monthly"] as const;
type CompositeInterval = (typeof COMPOSITE_INTERVALS)[number];

const LS_COMPOSITE_ENABLED = "egx-dashboard-composite-enabled";
const LS_COMPOSITE_INTERVAL = "egx-dashboard-composite-interval";

export default function Dashboard() {
  const { tickers, loading } = useTickers();
  const [index, setIndex] = useState("EGX30");
  const [sector, setSector] = useState("All Sectors");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showComposite, setShowComposite] = useState(true);
  const [compositeInterval, setCompositeInterval] =
    useState<CompositeInterval>("Daily");

  // Hydrate toggle + interval from localStorage on mount (client-only).
  useEffect(() => {
    const enabled = window.localStorage.getItem(LS_COMPOSITE_ENABLED);
    if (enabled === "false") setShowComposite(false);
    const iv = window.localStorage.getItem(LS_COMPOSITE_INTERVAL);
    if (iv && (COMPOSITE_INTERVALS as readonly string[]).includes(iv)) {
      setCompositeInterval(iv as CompositeInterval);
    }
  }, []);
  const [priceData, setPriceData] = useState<
    Record<string, { price: number; change: number; changePct: number; sparkline: number[] }>
  >({});
  const [compositeData, setCompositeData] = useState<
    Record<string, { score: number; signal: CompositeSignal }>
  >({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const retriedRef = useRef<Set<string>>(new Set());
  const { version: weightsVersion } = useScoreWeights();
  const { symbols: watchlistSymbols } = useWatchlist();

  // Filter & search
  const filtered = useMemo(() => {
    let result = tickers;

    if (index !== "All") {
      result = result.filter((t) => t.index === index);
    }
    if (sector !== "All Sectors") {
      result = result.filter((t) => t.sector === sector);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickers, index, sector, search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [index, sector, search]);

  const visible = filtered.slice(0, page * CARDS_PER_PAGE);
  const hasMore = visible.length < filtered.length;

  const toggleComposite = () => {
    setShowComposite((prev) => {
      const next = !prev;
      window.localStorage.setItem(LS_COMPOSITE_ENABLED, next ? "true" : "false");
      return next;
    });
  };

  const pickInterval = (iv: CompositeInterval) => {
    setCompositeInterval(iv);
    window.localStorage.setItem(LS_COMPOSITE_INTERVAL, iv);
  };

  // Reset caches when user saves new weights, hits refresh, toggles score, or changes interval
  useEffect(() => {
    setCompositeData({});
    setPriceData({});
    inFlightRef.current = new Set();
    retriedRef.current = new Set();
  }, [weightsVersion, refreshKey, showComposite, compositeInterval]);

  // Batch-fetch composite + price + sparkline for visible cards + watchlist
  useEffect(() => {
    if (!showComposite) return;

    const tickerBySym = new Map(tickers.map((t) => [t.symbol.toUpperCase(), t]));
    const watchlistTickers = watchlistSymbols
      .map((s) => tickerBySym.get(s.toUpperCase()))
      .filter((t): t is Ticker => !!t);

    const seen = new Set<string>();
    const candidates = [...visible, ...watchlistTickers].filter((t) => {
      if (seen.has(t.symbol)) return false;
      seen.add(t.symbol);
      return true;
    });

    const toFetch = candidates
      .filter(
        (t) =>
          !compositeData[t.symbol] &&
          !priceData[t.symbol] &&
          !inFlightRef.current.has(t.symbol)
      )
      .map((t) => t.symbol);

    if (!toFetch.length) return;

    toFetch.forEach((s) => inFlightRef.current.add(s));

    const mergeBatch = (res: Awaited<ReturnType<typeof fetchCompositeBatch>>) => {
      const nextComposite: Record<string, { score: number; signal: CompositeSignal }> = {};
      const nextPrice: typeof priceData = {};
      for (const [sym, entry] of Object.entries(res.scores)) {
        nextComposite[sym] = { score: entry.score, signal: entry.signal };
        if (entry.price != null && entry.sparkline) {
          nextPrice[sym] = {
            price: entry.price,
            change: entry.change ?? 0,
            changePct: entry.change_pct ?? 0,
            sparkline: entry.sparkline,
          };
        }
      }
      if (Object.keys(nextComposite).length) {
        setCompositeData((prev) => ({ ...prev, ...nextComposite }));
      }
      if (Object.keys(nextPrice).length) {
        setPriceData((prev) => ({ ...prev, ...nextPrice }));
      }
    };

    // Fire each chunk independently so state updates stream in as chunks
    // complete — cards populate progressively instead of all at once once
    // the slowest chunk is done.
    const chunks: string[][] = [];
    for (let i = 0; i < toFetch.length; i += DASHBOARD_FETCH_CHUNK_SIZE) {
      chunks.push(toFetch.slice(i, i + DASHBOARD_FETCH_CHUNK_SIZE));
    }

    chunks.forEach((chunk) => {
      fetchCompositeBatch(chunk, compositeInterval)
        .then((res) => {
          mergeBatch(res);

          // Symbols the backend reported as upstream timeouts likely finished
          // their fetch in background threads moments after we returned — retry
          // once after a short delay to pick up the now-cached values.
          const retryables = res.errors
            .map((e) => e.symbol)
            .filter((s) => !retriedRef.current.has(s));
          if (retryables.length) {
            retryables.forEach((s) => retriedRef.current.add(s));
            setTimeout(() => {
              fetchCompositeBatch(retryables, compositeInterval)
                .then(mergeBatch)
                .catch(() => {});
            }, COMPOSITE_RETRY_DELAY_MS);
          }
        })
        .catch(() => {})
        .finally(() => {
          chunk.forEach((s) => inFlightRef.current.delete(s));
        });
    });
  }, [
    visible.map((v) => v.symbol).join(","),
    watchlistSymbols.join(","),
    weightsVersion,
    refreshKey,
    showComposite,
    compositeInterval,
  ]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  EGX Market Overview
                </h1>
                <p className="mt-1 text-sm text-white/40">
                  Browse Egyptian Exchange listed stocks. Click any card to see
                  detailed analysis.
                </p>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                aria-label="Refresh prices"
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-accent/30 hover:text-accent"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>

            {/* Search — sticky on mobile */}
            <div className="sticky top-[56px] z-30 -mx-4 mb-3 bg-charcoal-dark/95 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or symbol..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50 md:w-auto"
              />
            </div>

            {/* Filters — index on one row, sector on its own row */}
            <div className="mb-3 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <IndexFilter selected={index} onChange={setIndex} />
            </div>
            <div className="mb-3 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <SectorFilter selected={sector} onChange={setSector} />
              <span className="whitespace-nowrap text-xs text-white/30">
                {filtered.length} stocks
              </span>
            </div>

            {/* Composite score toggle + interval — lets users sync card scores with the stock detail page */}
            <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <button
                onClick={toggleComposite}
                aria-pressed={showComposite}
                className={`min-h-[36px] whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  showComposite
                    ? "bg-accent/20 text-accent"
                    : "border border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                <LearnTooltip
                  term={`Score: ${showComposite ? "On" : "Off"}`}
                  explanation="Turns on the composite signal badge on each card. The score re-calculates when you change interval — Daily, Weekly, or Monthly use different timeframes, so the score shifts. Match the interval to what you'll see on the detail page to keep numbers in sync."
                >
                  <span>Score: {showComposite ? "On" : "Off"}</span>
                </LearnTooltip>
              </button>
              {showComposite && (
                <div className="flex gap-1.5">
                  {COMPOSITE_INTERVALS.map((iv) => (
                    <button
                      key={iv}
                      onClick={() => pickInterval(iv)}
                      className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        compositeInterval === iv
                          ? "bg-accent/20 text-accent"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stock cards grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <p className="text-sm text-white/40">
                  No stocks found matching your filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {visible.map((t) => {
                    const pd = priceData[t.symbol];
                    const cd = compositeData[t.symbol];
                    return (
                      <StockCard
                        key={t.symbol}
                        symbol={t.symbol}
                        name={t.name}
                        sector={t.sector}
                        price={pd?.price}
                        change={pd?.change}
                        changePct={pd?.changePct}
                        sparklineData={pd?.sparkline}
                        compositeScore={cd?.score ?? null}
                        compositeSignal={cd?.signal ?? null}
                        interval={showComposite ? compositeInterval : undefined}
                      />
                    );
                  })}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-white/10 px-6 py-2 text-sm text-white/50 transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      Load More ({filtered.length - visible.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Watchlist sidebar */}
          <div className="w-full lg:w-80">
            <div className="lg:sticky lg:top-[72px]">
              <WatchlistPanel tickers={tickers} priceData={priceData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
