"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LearnTooltip from "./LearnTooltip";
import { fetchMarketRegime, type MarketBreadth, type MarketRegime } from "../lib/api";

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

const BREADTH_EXPLANATION =
  "How many shares are participating, rather than how the index looks. " +
  "Measured from last night's risk snapshot, so it stays current even when " +
  "nothing else has been refreshed. Its link to the next three months is weak " +
  "and does not clear this app's evidence bar — read it as a description of " +
  "today, not a forecast.";

/**
 * Breadth — how much of the market is participating, from last night's risk
 * snapshot rather than from the score cache.
 *
 * It sits INSIDE this card rather than beside it. Breadth and the score average
 * answer the same question from two sources, and two competing market cards on
 * one screen invite picking whichever agrees with you. Nesting also makes the
 * real relationship legible: breadth is what stays fresh when the score cache
 * goes cold, which is most of the time now the app is closed.
 *
 * COLOUR IS THE CAREFUL PART. `% above the 200-day average` is a genuine
 * direction, so gain/loss applies as it does everywhere else. `% oversold` is
 * NOT: more stocks oversold measured WORSE forward returns (rho −0.188), so
 * painting it green as a dip-buying opportunity would teach the opposite of
 * what was measured. It stays neutral and the sign is stated in words.
 */
function BreadthStrip({ breadth }: { breadth: MarketBreadth }) {
  if (!breadth.enough_data || breadth.pct_above_sma200 == null) {
    return (
      <div className="mt-3 border-t border-white/5 pt-3">
        <div className="text-[10px] uppercase tracking-wider text-white/40">
          <LearnTooltip term="Market breadth" explanation={BREADTH_EXPLANATION}>
            <span>Market breadth</span>
          </LearnTooltip>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/40">
          Needs at least 15 measured stocks; {breadth.n_symbols} are in
          last night&rsquo;s snapshot so far. It fills in as the nightly risk job
          works through the market.
        </p>
      </div>
    );
  }

  const above = breadth.pct_above_sma200;
  // A real direction — more of the market above its own long-term average IS
  // broader participation — but only outside a neutral middle. At 50% the
  // market is evenly split, and painting that green (or 49.9% red) would claim
  // a direction the reading does not have. The app makes the same refusal for
  // the regime card's top two bands, which are 68.5% against 68.9%.
  const tone =
    above >= 55 ? "bg-gain" : above <= 45 ? "bg-loss" : "bg-white/30";

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider text-white/40">
          <LearnTooltip term="Market breadth" explanation={BREADTH_EXPLANATION}>
            <span>Market breadth</span>
          </LearnTooltip>
        </div>
        <div className="text-[10px] text-white/30">
          {breadth.n_symbols} tradeable stocks
        </div>
      </div>

      {/* A proportion, drawn as a proportion. The 50% tick is the reference
          that makes the fill readable at a glance on a phone. */}
      <div className="mt-2 relative h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={`absolute inset-y-0 left-0 ${tone} opacity-70`}
          style={{ width: `${Math.max(0, Math.min(100, above))}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
      </div>

      <div className="mt-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs text-white/70">
          <span className="font-mono font-semibold text-white">{above}%</span>{" "}
          above their 200-day average
        </span>
        {breadth.mean_rsi != null && (
          <span className="text-[10px] text-white/30">
            avg RSI <span className="font-mono">{breadth.mean_rsi}</span>
          </span>
        )}
      </div>

      {breadth.pct_oversold != null && breadth.pct_oversold > 0 && (
        <p className="mt-2 text-[10px] leading-relaxed text-white/40">
          <span className="font-mono text-white/60">{breadth.pct_oversold}%</span>{" "}
          are oversold (RSI under 30).{" "}
          {/* Stated, not coloured. This is the one measured detail a reader is
              most likely to get backwards on their own. */}
          <span className="text-white/50">
            On EGX history that has leaned the wrong way — periods with more
            oversold shares were followed by weaker returns, not a bounce
          </span>
          {breadth.evidence && (
            <>
              {" "}
              (rank correlation{" "}
              <span className="font-mono">
                {breadth.evidence.strongest_rho.toFixed(2)}
              </span>
              , t{" "}
              <span className="font-mono">
                {breadth.evidence.strongest_t.toFixed(2)}
              </span>
              {breadth.evidence.significant_at_project_bar === false
                ? ", still too weak to act on"
                : ""}
              )
            </>
          )}
          .
        </p>
      )}
    </div>
  );
}

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
              explanation="The average composite score across EGX30 and EGX70 constituents — a reading of how broadly healthy the market is right now, NOT a call on any single stock. Its link to the market's next three months was measured and is weak enough that it does not pass a significance test, so read it as context about today, not as a forecast."
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
          and were positive {Math.round(data.hist_positive_rate * 100)}% of the
          time &mdash; and negative or flat the other{" "}
          {100 - Math.round(data.hist_positive_rate * 100)}%
          {data.observations ? ` (${data.observations} readings)` : ""}.
          {data.association_rho != null && (
            <>
              {" "}
              The link behind this is weak: rank correlation{" "}
              <span className="font-mono">
                +{data.association_rho.toFixed(2)}
              </span>
              {data.association_t != null && (
                <>
                  , t <span className="font-mono">{data.association_t.toFixed(2)}</span>
                </>
              )}{" "}
              across {data.association_n} overlapping readings
              {data.association_significant === false
                ? ", which does not clear the usual significance bar"
                : ""}
              . Treat it as context, never a prediction.
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

      {data.breadth && <BreadthStrip breadth={data.breadth} />}

      <Link
        href="/learn#market_condition"
        className="mt-3 inline-block text-[10px] text-accent/70 hover:text-accent"
      >
        What does this mean? &rarr;
      </Link>
    </div>
  );
}
