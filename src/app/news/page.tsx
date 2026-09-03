"use client";

import { useEffect, useState } from "react";
import NewsList from "../components/NewsList";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { fetchNews } from "../lib/api";
import type { NewsResponse } from "../lib/types";

/**
 * The in-flight skeleton, shared with loading.tsx's visual.
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
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-white/10" />
      <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
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
        <h1 className="mb-4 text-xl font-bold text-white">News</h1>
        <p className="rounded-lg border border-white/5 bg-charcoal p-4 text-sm text-white/60">
          Couldn&apos;t load the news feed. {error}
        </p>
      </div>
    );
  }

  if (!data) return <NewsSkeleton />;

  const { coverage } = data;
  const quiet = coverage.symbols_without_news.length;
  const overCap = coverage.symbols_over_cap.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold text-white">News</h1>

      {/* The count line stays truthful about what ISN'T here — the same
          convention as the dashboard's "82 stocks · 84 without a price feed".
          An absent thing should be visible, not silently missing. That now
          covers two different absences: stocks with no news, and stocks the
          symbol cap couldn't fit in at all. */}
      <p className="mb-6 text-xs text-white/40">
        Last {coverage.window_days} days
        {quiet > 0 && (
          <>
            {" · "}
            {quiet} of your {coverage.symbols_requested} stocks had no news
            {" ("}
            {coverage.symbols_without_news.join(", ")}
            {")"}
          </>
        )}
        {overCap > 0 && (
          <>
            {" · "}
            {overCap} more not shown (over the limit)
          </>
        )}
        {data.status === "partial" && " · partial: some symbols timed out"}
      </p>

      <NewsList
        title="Your stocks"
        items={data.your_stocks}
        emptyNote={
          coverage.symbols_requested === 0
            ? "Add holdings or watch a stock to see news about it here."
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
