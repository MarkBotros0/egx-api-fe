"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  fetchWatchlist,
  addToWatchlist as apiAdd,
  removeFromWatchlist as apiRemove,
} from "../lib/api";
import type { Ticker } from "../lib/types";
import { useAuth } from "./AuthProvider";

const LEGACY_STORAGE_KEY = "egx-watchlist";

interface WatchlistCtx {
  symbols: string[];
  loading: boolean;
  add: (sym: string) => void;
  remove: (sym: string) => void;
  has: (sym: string) => boolean;
}

const Ctx = createContext<WatchlistCtx | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const migratedRef = useRef(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setSymbols([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      // One-time migration: push any localStorage entries to the DB, then clear.
      let legacy: string[] = [];
      if (!migratedRef.current) {
        migratedRef.current = true;
        try {
          const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              legacy = parsed.filter((s): s is string => typeof s === "string");
            }
          }
        } catch {}
        if (legacy.length) {
          await Promise.allSettled(legacy.map((s) => apiAdd(s)));
          try {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          } catch {}
        }
      }

      try {
        const resp = await fetchWatchlist();
        if (!cancelled) setSymbols(resp.symbols || []);
      } catch {
        if (!cancelled) setSymbols(legacy.map((s) => s.toUpperCase()));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const add = useCallback((sym: string) => {
    const upper = sym.toUpperCase();
    setSymbols((prev) => (prev.includes(upper) ? prev : [...prev, upper]));
    apiAdd(upper).catch(() => {
      setSymbols((prev) => prev.filter((s) => s !== upper));
    });
  }, []);

  const remove = useCallback((sym: string) => {
    const upper = sym.toUpperCase();
    let prevList: string[] = [];
    setSymbols((prev) => {
      prevList = prev;
      return prev.filter((s) => s !== upper);
    });
    apiRemove(upper).catch(() => {
      setSymbols(prevList);
    });
  }, []);

  const has = useCallback(
    (sym: string) => symbols.includes(sym.toUpperCase()),
    [symbols]
  );

  const value = useMemo<WatchlistCtx>(
    () => ({ symbols, loading, add, remove, has }),
    [symbols, loading, add, remove, has]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWatchlist(): WatchlistCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      symbols: [],
      loading: false,
      add: () => {},
      remove: () => {},
      has: () => false,
    };
  }
  return ctx;
}

interface WatchlistPanelProps {
  tickers?: Ticker[];
  priceData?: Record<
    string,
    { price: number; change: number; changePct: number; sparkline: number[] }
  >;
}

function WatchlistRow({
  symbol,
  name,
  price,
  changePct,
  sparkline,
  onRemove,
}: {
  symbol: string;
  name?: string;
  price?: number;
  changePct?: number;
  sparkline?: number[];
  onRemove: () => void;
}) {
  const hasPrice = price !== undefined;
  const isPositive = (changePct ?? 0) >= 0;
  const color = isPositive ? "#00ff88" : "#ff3355";
  const chartData = sparkline?.map((v, i) => ({ i, v })) ?? [];

  return (
    <div className="group relative flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.05]">
      <Link
        href={`/stock/${symbol}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-white">
              {symbol}
            </span>
            {hasPrice && (
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color }}
              >
                {isPositive ? "+" : ""}
                {changePct?.toFixed(2)}%
              </span>
            )}
          </div>
          {name && (
            <p className="truncate text-[11px] text-white/40">{name}</p>
          )}
        </div>

        {chartData.length > 1 && (
          <div className="h-7 w-14 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="shrink-0 text-right">
          {hasPrice ? (
            <p className="font-mono text-sm font-semibold text-white">
              {price.toFixed(2)}
            </p>
          ) : (
            <p className="font-mono text-xs text-white/30">--</p>
          )}
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Remove ${symbol} from watchlist`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-loss/10 hover:text-loss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </div>
  );
}

export default function WatchlistPanel({
  tickers,
  priceData,
}: WatchlistPanelProps = {}) {
  const { symbols, loading, remove } = useWatchlist();

  const tickerByCode = useMemo(() => {
    const m = new Map<string, Ticker>();
    (tickers ?? []).forEach((t) => m.set(t.symbol.toUpperCase(), t));
    return m;
  }, [tickers]);

  const header = (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <h3 className="text-sm font-semibold text-white">Watchlist</h3>
      </div>
      {symbols.length > 0 && (
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
          {symbols.length}
        </span>
      )}
    </div>
  );

  if (loading && !symbols.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        {header}
        <p className="text-xs text-white/30">Loading...</p>
      </div>
    );
  }

  if (!symbols.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
        {header}
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/40"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <p className="text-xs leading-relaxed text-white/40">
          Your watchlist is empty. Tap the star on any stock to track it here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 md:p-4">
      {header}
      <div className="space-y-2">
        {symbols.map((sym) => {
          const t = tickerByCode.get(sym.toUpperCase());
          const pd = priceData?.[sym];
          return (
            <WatchlistRow
              key={sym}
              symbol={sym}
              name={t?.name}
              price={pd?.price}
              changePct={pd?.changePct}
              sparkline={pd?.sparkline}
              onRemove={() => remove(sym)}
            />
          );
        })}
      </div>
    </div>
  );
}
