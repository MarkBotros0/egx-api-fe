"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import StockCard from "./components/StockCard";
import IndexFilter from "./components/IndexFilter";
import SectorFilter from "./components/SectorFilter";
import WatchlistPanel, { useWatchlist } from "./components/Watchlist";
import { CardSkeleton } from "./components/LoadingSkeleton";
import { useScoreWeights } from "./components/ScoreWeightsProvider";
import { fetchCompositeBatch, fetchTickers } from "./lib/api";
import type { Ticker, CompositeSignal } from "./lib/types";

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
  const [compositeData, setCompositeData] = useState<
    Record<string, { score: number; signal: CompositeSignal }>
  >({});
  const inFlightRef = useRef<Set<string>>(new Set());
  const retriedRef = useRef<Set<string>>(new Set());
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

  // Reset caches when user saves new weights
  useEffect(() => {
    setCompositeData({});
    setPriceData({});
    inFlightRef.current = new Set();
    retriedRef.current = new Set();
  }, [weightsVersion]);

  // Batch-fetch composite + price + sparkline for visible cards + watchlist
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
    const CHUNK = 2;
    const chunks: string[][] = [];
    for (let i = 0; i < toFetch.length; i += CHUNK) {
      chunks.push(toFetch.slice(i, i + CHUNK));
    }

    chunks.forEach((chunk) => {
      fetchCompositeBatch(chunk)
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
              fetchCompositeBatch(retryables).then(mergeBatch).catch(() => {});
            }, 4000);
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
  ]);

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

            {/* Filters — index on one row, sector on its own row */}
            <div className="mb-3 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <IndexFilter selected={index} onChange={setIndex} />
            </div>
            <div className="mb-4 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
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
