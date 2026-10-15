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
 *
 * WHICH series each variant draws lives in lib/learnLive.ts, shared with the
 * mobile app.
 */

import { useEffect, useRef, useState } from "react";
import { fetchAnalysis } from "../../lib/api";
import type { AnalysisResponse } from "../../lib/types";
import { V, specProps, type LiveVariant } from "../../lib/learnVisuals";
import { LIVE_BARS, LIVE_SYMBOL, liveVisual } from "../../lib/learnLive";
import { MiniChart, ZoneScale } from "./visuals";

export type { LiveVariant };

let inflight: Promise<AnalysisResponse> | null = null;

function loadAnalysis(): Promise<AnalysisResponse> {
  if (!inflight) {
    // Pinned to EG: the Learn examples are EGX (COMI), whatever market is selected.
    inflight = fetchAnalysis(LIVE_SYMBOL, "Daily", LIVE_BARS, { market: "EG" }).catch((err) => {
      inflight = null; // let a later concept retry
      throw err;
    });
  }
  return inflight;
}

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

  const spec = data ? liveVisual(variant, data, caption) : null;
  const chart =
    spec === null ? null : spec.kind === "MiniChart" ? (
      <MiniChart {...specProps(spec)} />
    ) : (
      <ZoneScale {...specProps(spec)} />
    );

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
          Live · {LIVE_SYMBOL} · daily
        </p>
      )}
    </div>
  );
}
