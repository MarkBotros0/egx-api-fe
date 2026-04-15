"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchTickers } from "../lib/api";
import type { Ticker } from "../lib/types";
import { useAuth } from "./AuthProvider";

interface TickersCtx {
  tickers: Ticker[];
  loading: boolean;
}

const Ctx = createContext<TickersCtx | null>(null);

export function TickersProvider({ children }: { children: React.ReactNode }) {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setTickers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchTickers()
      .then((data) => {
        if (!cancelled) setTickers(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const value = useMemo<TickersCtx>(
    () => ({ tickers, loading }),
    [tickers, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTickers(): TickersCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { tickers: [], loading: false };
  return ctx;
}
