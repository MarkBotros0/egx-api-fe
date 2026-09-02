"use client";

/**
 * Real EGX data inside a Learn concept.
 *
 * Three constraints shaped this:
 *
 * 1. **One fetch for the whole page.** Every instance shares a single
 *    module-level promise, so five live concepts cost one `/api/analysis`
 *    call, not five.
 * 2. **Nothing loads until it's on screen.** An IntersectionObserver defers
 *    the fetch until a live concept scrolls into view, so opening the Learn
 *    page stays as instant as it was when it was pure text.
 * 3. **It must degrade to the diagram.** The page is service-worker cached
 *    and read offline; on any failure the caller's static SVG renders
 *    instead, with no error surfaced. A teaching page does not need to
 *    explain a network problem — it needs to keep teaching.
 */

import { useEffect, useRef, useState } from "react";
import { fetchAnalysis } from "../../lib/api";
import type { AnalysisResponse } from "../../lib/types";
import { MiniChart, ZoneScale, V } from "./visuals";

/** The most liquid EGX30 name — long history, so every overlay resolves. */
const SYMBOL = "COMI";
const BARS = 180;
/** Points actually drawn. Fewer than the fetch, so SMA200 is warm at the left edge. */
const SHOWN = 110;

let inflight: Promise<AnalysisResponse> | null = null;

function loadAnalysis(): Promise<AnalysisResponse> {
  if (!inflight) {
    inflight = fetchAnalysis(SYMBOL, "Daily", BARS).catch((err) => {
      inflight = null; // let a later concept retry
      throw err;
    });
  }
  return inflight;
}

export type LiveVariant =
  | "trend"
  | "bollinger"
  | "rsi"
  | "levels"
  | "score"
  | "volume";

const tail = <T,>(arr: T[] | undefined, n: number): T[] =>
  arr ? arr.slice(Math.max(0, arr.length - n)) : [];

export default function LiveChart({
  variant,
  fallback,
  caption,
}: {
  variant: LiveVariant;
  /** Rendered while loading, and permanently if the data never arrives. */
  fallback: React.ReactNode;
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || data || failed) return;
    let alive = true;
    loadAnalysis()
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [visible, data, failed]);

  const chart = data ? render(variant, data, caption) : null;

  return (
    <div ref={ref}>
      {chart ?? fallback}
      {chart && (
        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-white/30">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: V.up }}
          />
          Live · {SYMBOL} · daily
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- variants

function render(
  variant: LiveVariant,
  d: AnalysisResponse,
  caption?: string
): React.ReactNode | null {
  const close = tail(d.ohlcv?.close, SHOWN);
  if (close.length < 20) return null;

  switch (variant) {
    case "trend": {
      const sma50 = tail(d.indicators?.sma_50, SHOWN);
      const sma200 = tail(d.indicators?.sma_200, SHOWN);
      if (sma50.every((v) => v === null)) return null;
      return (
        <MiniChart
          series={close}
          lines={[
            { values: sma50, color: V.accent, width: 1.4 },
            { values: sma200, color: V.gold, width: 1.4 },
          ]}
          legend={[
            { color: V.inkBright, label: `${SYMBOL} close` },
            { color: V.accent, label: "SMA 50" },
            { color: V.gold, label: "SMA 200" },
          ]}
          caption={caption}
          height={150}
        />
      );
    }

    case "bollinger": {
      const upper = tail(d.indicators?.bollinger_upper, SHOWN);
      const lower = tail(d.indicators?.bollinger_lower, SHOWN);
      const mid = tail(d.indicators?.bollinger_middle, SHOWN);
      if (upper.every((v) => v === null)) return null;
      return (
        <MiniChart
          series={close}
          band={{ upper, lower, color: V.violet }}
          lines={[{ values: mid, color: V.violet, width: 1.2, dash: "3 3" }]}
          legend={[
            { color: V.inkBright, label: `${SYMBOL} close` },
            { color: V.violet, label: "20-day band" },
          ]}
          caption={
            caption ??
            (d.bb_squeeze
              ? "Right now the bands are squeezed — a bigger move is building."
              : undefined)
          }
          height={150}
          fill={false}
        />
      );
    }

    case "rsi": {
      const rsi = tail(d.indicators?.rsi, SHOWN).filter(
        (v): v is number => v !== null && Number.isFinite(v)
      );
      if (rsi.length < 20) return null;
      const now = rsi[rsi.length - 1];
      return (
        <MiniChart
          series={rsi}
          levels={[
            { value: 70, color: V.down, label: "70" },
            { value: 30, color: V.up, label: "30" },
          ]}
          markers={[
            {
              index: rsi.length - 1,
              color: now >= 70 ? V.down : now <= 30 ? V.up : V.gold,
              label: `now ${now.toFixed(0)}`,
            },
          ]}
          priceColor={V.gold}
          caption={caption ?? `${SYMBOL}'s actual RSI over the last few months.`}
          height={130}
          labelPad={22}
        />
      );
    }

    case "levels": {
      const sup = d.support_resistance?.supports?.[0];
      const res = d.support_resistance?.resistances?.[0];
      if (!sup && !res) return null;
      return (
        <MiniChart
          series={close}
          levels={[
            ...(res ? [{ value: res.price, color: V.down, label: "resist" }] : []),
            ...(sup ? [{ value: sup.price, color: V.up, label: "support" }] : []),
          ]}
          legend={[
            { color: V.up, label: "support", dash: true },
            { color: V.down, label: "resistance", dash: true },
          ]}
          caption={
            caption ??
            `${SYMBOL}'s detected levels. Note how far apart they sit — that gap is where your stop has to live.`
          }
          height={150}
          labelPad={40}
        />
      );
    }

    case "volume": {
      const vol = tail(d.ohlcv?.volume, SHOWN);
      if (!vol.length) return null;
      return (
        <MiniChart
          series={vol}
          priceColor={V.teal}
          caption={
            caption ?? `${SYMBOL}'s daily traded volume. Spikes mark the days a move was real.`
          }
          height={110}
        />
      );
    }

    case "score": {
      const s = d.composite_score?.score;
      if (typeof s !== "number") return null;
      return (
        <ZoneScale
          zones={[
            { from: 0, to: 20, color: V.down, label: "Very Weak" },
            { from: 20, to: 40, color: V.coral, label: "Weak" },
            { from: 40, to: 60, color: "#7f8ea3", label: "Neutral" },
            { from: 60, to: 80, color: V.up, label: "Strong" },
            { from: 80, to: 100, color: V.up, label: "Very Strong" },
          ]}
          markers={[{ value: s, label: `${SYMBOL} ${s.toFixed(0)}` }]}
          ticks={[0, 20, 40, 60, 80, 100]}
          caption={
            caption ??
            `${SYMBOL}'s composite right now, on your own weights. A reading of condition — not a forecast.`
          }
        />
      );
    }
  }
  return null;
}
