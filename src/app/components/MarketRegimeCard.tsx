"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LearnTooltip from "./LearnTooltip";
import { fetchMarketRegime, type MarketRegime } from "../lib/api";

/**
 * The market-condition reading — the app's only forecast-shaped surface.
 *
 * Every claim it renders comes from the API payload rather than being written
 * here, so the wording and the measurement behind it cannot drift apart.
 *
 * Coverage builds as the dashboard scores cards, because the reading averages
 * scores the batch endpoint has already computed rather than fetching 79
 * symbols itself. Until enough have landed it says so plainly instead of
 * averaging a handful into a confident-looking number.
 */

const TONE: Record<string, { ring: string; text: string; bar: string }> = {
  weak: { ring: "border-loss/25", text: "text-loss", bar: "bg-loss" },
  mixed: { ring: "border-accent/25", text: "text-accent", bar: "bg-accent" },
  broad: { ring: "border-gain/25", text: "text-gain", bar: "bg-gain" },
};

export default function MarketRegimeCard() {
  const [data, setData] = useState<MarketRegime | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMarketRegime()
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-6 w-40 animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  const tone = (data.band && TONE[data.band]) || {
    ring: "border-white/10",
    text: "text-white/50",
    bar: "bg-white/20",
  };

  // Position on the 35–60 range the reading has historically occupied.
  const pos =
    data.mean_score != null
      ? Math.max(0, Math.min(100, ((data.mean_score - 35) / 25) * 100))
      : null;

  return (
    <div className={`rounded-xl border ${tone.ring} bg-white/[0.02] p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/40">
            <LearnTooltip
              term="Market Condition"
              explanation="The average composite score across EGX30 and EGX70 constituents — a reading of how broadly healthy the market is, NOT a call on any single stock. This is the only measure in the app with a tested association to future returns, and it applies to the market as a whole over roughly three months."
            >
              <span>Market Condition</span>
            </LearnTooltip>
          </div>
          <div className={`mt-1 text-lg font-semibold ${tone.text}`}>{data.label}</div>
        </div>
        {data.mean_score != null && (
          <div className="text-right">
            <div className="font-mono text-2xl font-semibold text-white">
              {data.mean_score.toFixed(1)}
            </div>
            <div className="text-[10px] text-white/30">
              avg of {data.n_symbols}
              {data.universe_size ? ` / ${data.universe_size}` : ""}
            </div>
          </div>
        )}
      </div>

      {pos != null && (
        <div className="mt-3">
          <div className="relative h-1.5 w-full rounded-full bg-white/5">
            <div
              className={`absolute top-0 h-1.5 w-1.5 rounded-full ${tone.bar}`}
              style={{ left: `calc(${pos}% - 3px)` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-white/25">
            <span>weak</span>
            <span>broad</span>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-white/60">{data.summary}</p>

      {data.band && data.hist_positive_rate != null && (
        <p className="mt-2 text-[10px] leading-relaxed text-white/35">
          Historically, from this level the EGX30&rsquo;s next {data.horizon_days}{" "}
          trading days had a median of{" "}
          <span className="font-mono">
            {data.hist_median_3m_pct != null && data.hist_median_3m_pct > 0 ? "+" : ""}
            {data.hist_median_3m_pct}%
          </span>{" "}
          and were positive {Math.round(data.hist_positive_rate * 100)}% of the time
          {data.observations ? ` (${data.observations} readings)` : ""}.
          {data.association_rho != null && (
            <>
              {" "}
              The association is modest &mdash; rank correlation{" "}
              <span className="font-mono">+{data.association_rho}</span> across{" "}
              {data.association_n} independent periods &mdash; so treat it as
              context, not a prediction.
            </>
          )}
        </p>
      )}

      {data.stale && (
        <p className="mt-2 text-[10px] text-white/30">
          Showing the last complete reading
          {data.observed_at ? ` from ${data.observed_at.slice(0, 10)}` : ""}. Only{" "}
          {data.n_symbols_now ?? 0} stocks are scored right now &mdash; browse the
          dashboard to refresh it.
        </p>
      )}

      {!data.band && !data.stale && (
        <p className="mt-2 text-[10px] text-white/30">{data.summary}</p>
      )}

      <Link
        href="/learn#market_condition"
        className="mt-3 inline-block text-[10px] text-accent/70 hover:text-accent"
      >
        What does this mean? &rarr;
      </Link>
    </div>
  );
}
