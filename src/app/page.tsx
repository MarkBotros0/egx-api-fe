"use client";

import { useState, useEffect, useMemo } from "react";
import StockCard from "./components/StockCard";
import IndexFilter from "./components/IndexFilter";
import SectorFilter from "./components/SectorFilter";
import WatchlistPanel, { useWatchlist } from "./components/Watchlist";
import { CardSkeleton } from "./components/LoadingSkeleton";
import { useScoreWeights } from "./components/ScoreWeightsProvider";
import { fetchCompositeBatch, fetchTickers, fetchOHLCV } from "./lib/api";
import type { Ticker, OHLCVResponse, CompositeSignal } from "./lib/types";

const CARDS_PER_PAGE = 24;

export default function Dashboard() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [index, setIndex] = useState("EGX30");
  const [sector, setSector] = useState("All Sectors");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<
    Record<string, { price: number; change: number; changePct: number; sparkline: number[] }>
  >({});
  const [loadingPrices, setLoadingPrices] = useState<Set<string>>(new Set());
  const [compositeData, setCompositeData] = useState<
    Record<string, { score: number; signal: CompositeSignal }>
  >({});
  const [loadingComposites, setLoadingComposites] = useState<Set<string>>(new Set());
  const { version: weightsVersion } = useScoreWeights();
  const { symbols: watchlistSymbols } = useWatchlist();

  // Fetch tickers list
  useEffect(() => {
    setLoading(true);
    fetchTickers()
      .then((data) => {
        setTickers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  // Reset composite cache when user saves new weights
  useEffect(() => {
    setCompositeData({});
    setLoadingComposites(new Set());
  }, [weightsVersion]);

  // Batch-fetch composite scores for newly-visible cards
  useEffect(() => {
    const toFetch = visible
      .filter((t) => !compositeData[t.symbol] && !loadingComposites.has(t.symbol))
      .map((t) => t.symbol);
    if (!toFetch.length) return;

    setLoadingComposites((prev) => {
      const n = new Set(prev);
      toFetch.forEach((s) => n.add(s));
      return n;
    });

    fetchCompositeBatch(toFetch)
      .then((res) => {
        setCompositeData((prev) => ({ ...prev, ...res.scores }));
      })
      .catch(() => {})
      .finally(() => {
        setLoadingComposites((prev) => {
          const n = new Set(prev);
          toFetch.forEach((s) => n.delete(s));
          return n;
        });
      });
  }, [visible.map((v) => v.symbol).join(","), weightsVersion]);

  // Fetch price data for visible cards + watchlist symbols (lazy loading)
  useEffect(() => {
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

    const toFetch = candidates.filter(
      (t) => !priceData[t.symbol] && !loadingPrices.has(t.symbol)
    );

    if (!toFetch.length) return;

    const newLoading = new Set(loadingPrices);
    toFetch.forEach((t) => newLoading.add(t.symbol));
    setLoadingPrices(newLoading);

    // Fetch in small batches to avoid overwhelming the API
    toFetch.forEach((t) => {
      fetchOHLCV(t.symbol, "Daily", 30)
        .then((data: OHLCVResponse) => {
          if (data.data?.length > 0) {
            const closes = data.data.map((d) => d.close);
            const last = closes[closes.length - 1];
            const prev = closes.length > 1 ? closes[closes.length - 2] : last;
            setPriceData((prev_data) => ({
              ...prev_data,
              [t.symbol]: {
                price: last,
                change: last - prev,
                changePct: prev !== 0 ? ((last - prev) / prev) * 100 : 0,
                sparkline: closes,
              },
            }));
          }
        })
        .catch(() => {});
    });
  }, [visible.map((v) => v.symbol).join(","), watchlistSymbols.join(",")]);

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">
                EGX Market Overview
              </h1>
              <p className="mt-1 text-sm text-white/40">
                Browse Egyptian Exchange listed stocks. Click any card to see
                detailed analysis.
              </p>
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

            {/* Filters — horizontal scrollable on mobile */}
            <div className="mb-4 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <IndexFilter selected={index} onChange={setIndex} />
              <SectorFilter selected={sector} onChange={setSector} />
              <span className="whitespace-nowrap text-xs text-white/30">
                {filtered.length} stocks
              </span>
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
