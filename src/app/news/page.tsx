"use client";

import { useEffect, useState } from "react";
import NewsList from "../components/NewsList";
import { fetchNews } from "../lib/api";
import type { NewsResponse } from "../lib/types";

/**
 * A single card's skeleton, matching NewsCard's real shape — source mark + two
 * headline lines + a chip. The in-flight state should be a fill of the layout
 * that's coming, not a differently-shaped placeholder that jumps on arrival.
 */
function NewsCardSkeleton() {
  return (
    <li className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 flex-none animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3.5 w-3/5 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/5" />
    </li>
  );
}

/**
 * The in-flight skeleton, shared in spirit with loading.tsx's visual.
 *
 * loading.tsx only covers the App Router's route-segment Suspense boundary
 * during NAVIGATION to /news. It does not cover the gap after this client
 * component has mounted and its own useEffect fetch is still in flight —
 * that gap is this component's to fill. Returning null there would paint a
 * blank screen for the duration of the fetch, the exact "reads as broken"
 * failure loading.tsx files exist to prevent (see CLAUDE.md, "Every route
 * segment has a loading.tsx").
 */
function NewsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 h-8 w-28 animate-pulse rounded bg-white/10" />
      <div className="mb-6 h-3 w-44 animate-pulse rounded bg-white/5" />
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-white/10" />
      <ul className="space-y-3">
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </ul>
    </div>
  );
}

export default function NewsPage() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchNews()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">News</h1>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-white/70">The news feed didn&apos;t load.</p>
          <p className="mt-1 text-xs text-white/40">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return <NewsSkeleton />;

  const { coverage } = data;
  const quiet = coverage.symbols_without_news.length;
  const overCap = coverage.symbols_over_cap.length;

  // What ISN'T here, kept visible rather than silently dropped — the dashboard's
  // "82 stocks · 84 without a price feed" convention. Split from the headline
  // window so the caveats read as a quieter second line, not a run-on.
  const caveats: string[] = [];
  if (quiet > 0) {
    caveats.push(
      `${quiet} of your ${coverage.symbols_requested} stocks had no news (${coverage.symbols_without_news.join(", ")})`
    );
  }
  if (overCap > 0) caveats.push(`${overCap} more over the fetch limit`);
  if (data.status === "partial") caveats.push("some sources timed out");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">News</h1>
        <p className="mt-1 text-xs text-white/40">
          Your holdings and the market, last {coverage.window_days} days
        </p>
        {caveats.length > 0 && (
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/30">
            {caveats.join(" · ")}
          </p>
        )}
      </header>

      <NewsList
        title="Your stocks"
        items={data.your_stocks}
        emptyNote={
          coverage.symbols_requested === 0
            ? "Add a holding or watch a stock, and news about it shows up here."
            : `Nothing in the last ${coverage.window_days} days for the stocks you hold or watch.`
        }
      />

      <NewsList
        title="Market"
        items={data.market}
        emptyNote={`No EGX30 news in the last ${coverage.window_days} days.`}
      />
    </div>
  );
}
