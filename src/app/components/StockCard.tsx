"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { scoreColor } from "./CompositeGauge";
import { RISK_BAND_COLOR } from "../lib/riskBands";
import type { CompositeSignal } from "../lib/types";

/**
 * What the card knows about its own data.
 *
 * These exist because "--" used to mean three different things at once — still
 * loading, the feed refused this symbol, and no data has ever existed for it —
 * and the reader could not tell which. So a card that would never fill looked
 * exactly like one that was about to, and the only available response was to
 * reload a page that was never going to change.
 */
export type CardState =
  | "loading"
  /** Live figures, fetched just now. */
  | "live"
  /** Real figures from the last snapshot; the price is a previous close. */
  | "stale"
  /** The exchange feed has no data for this symbol. Retrying will not help. */
  | "unavailable"
  /** The request failed. Retrying might help, so the card offers it. */
  | "failed";

interface StockCardProps {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePct?: number;
  sparklineData?: number[];
  sector?: string;
  compositeSignal?: CompositeSignal | null;
  /** 0-100 composite. Shown as the number rather than a Buy/Hold word. */
  compositeScore?: number | null;
  /**
   * The Calm..Wild volatility band from the risk grade — how much this moves,
   * never which way. A tiny coloured dot + label under the score. Null/absent
   * for a stock too thin to grade, which draws no dot. Independent of the
   * composite score toggle: it is a different axis (movement, not condition).
   */
  riskBand?: string | null;
  riskBandLabel?: string | null;
  interval?: string;
  /**
   * Interval the price change covers. The dashboard's batch endpoint returns
   * a one-bar change on whatever interval is selected, so on "Monthly" the
   * percentage is month-over-month, not today's move.
   */
  changeInterval?: string;
  state?: CardState;
  /** The session this price belongs to, already formatted, e.g. "2 Sep". */
  asOf?: string | null;
  /** True when `asOf` is today's session, which may still be trading. */
  isToday?: boolean;
  /** How long ago these figures were fetched, e.g. "14s ago". Ticks live. */
  fetchedAgo?: string | null;
  /**
   * The EGX is shut right now (weekend, or outside 10:00-14:30 Cairo). When
   * true the card shows a static "Market closed" in place of the climbing
   * "...ago" — a price cannot get newer than the last close while the market
   * is closed, so a growing age reads as staleness that isn't real.
   */
  marketClosed?: boolean;
  onRetry?: () => void;
}

export default function StockCard({
  symbol,
  name,
  price,
  change,
  changePct,
  sparklineData,
  sector,
  compositeSignal,
  compositeScore,
  riskBand,
  riskBandLabel,
  interval,
  changeInterval,
  state = "live",
  asOf,
  isToday = false,
  fetchedAgo,
  marketClosed = false,
  onRetry,
}: StockCardProps) {
  const isPositive = (changePct ?? 0) >= 0;
  const color = isPositive ? "#00ff88" : "#ff3355";

  const chartData = sparklineData?.map((v, i) => ({ i, v })) ?? [];

  // The sparkline draws ~30 sessions, so colour it by the move across that
  // window — not by `changePct`, which is a SINGLE bar. A stock down 22%
  // over the month that ticked up 0.4% today drew a visibly falling line in
  // gain-green. The price-change text below keeps its own (correct) colour.
  const sparkStart = sparklineData?.[0];
  const sparkEnd = sparklineData?.[sparklineData.length - 1];
  const sparkPositive =
    sparkStart !== undefined && sparkEnd !== undefined
      ? sparkEnd >= sparkStart
      : isPositive;
  const sparkColor = sparkPositive ? "#00ff88" : "#ff3355";
  const href = interval
    ? `/stock/${symbol}?interval=${encodeURIComponent(interval)}`
    : `/stock/${symbol}`;

  // A symbol the exchange feed does not serve is still a real listed company,
  // so it keeps its card and its link — it just says plainly that there is no
  // price rather than pretending to load one. Muted, not alarming: this is
  // information about the feed, not a fault the reader can act on.
  const muted = state === "unavailable";

  return (
    <Link href={href}>
      <div
        className={`group rounded-xl border p-4 transition-all hover:border-white/10 hover:bg-white/[0.06] hover:-translate-y-0.5 ${
          muted
            ? "border-white/5 bg-white/[0.01] opacity-60"
            : "border-white/5 bg-white/[0.03]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-white">
              {symbol}
            </h3>
            <p className="mt-0.5 text-xs text-white/40 line-clamp-1">
              {name}
            </p>
          </div>
          {/* Right column: the composite score (or sector), and beneath it the
              risk grade. They are two different axes — the score reads
              CONDITION, the risk band reads how much the stock MOVES — so they
              stack rather than compete. */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            {/* The score itself, not a Buy/Hold word. The number carries how
                strong the reading is - 61 and 79 are both "Buy" but they are
                not the same setup - and it matches the gauge on the detail
                page, so the two surfaces cannot appear to disagree. */}
            {compositeScore != null ? (
              <span
                className="flex flex-col items-center leading-none"
                title={compositeSignal ? `${compositeScore.toFixed(0)} / 100 — ${compositeSignal}` : undefined}
              >
                <span
                  className="font-mono text-lg font-bold"
                  style={{ color: scoreColor(compositeScore) }}
                >
                  {compositeScore.toFixed(0)}
                </span>
                <span className="mt-0.5 text-[8px] uppercase tracking-wider text-white/30">
                  score
                </span>
              </span>
            ) : sector ? (
              <span className="whitespace-nowrap rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent/70">
                {sector}
              </span>
            ) : null}

            {/* Risk grade — how much this moves, NOT which way. Colour is the
                shared cool→hot ramp, never gain/loss. A dot for the band, the
                word for the meaning, so colour is reinforcement and not the
                only signal. Suppressed on a no-feed card, whose only band would
                be a stale measurement from before it went dark. */}
            {riskBand && state !== "unavailable" && (
              <span
                className="flex items-center gap-1 leading-none"
                title={`Risk: ${riskBandLabel ?? riskBand} — how much it moves, not which way`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: RISK_BAND_COLOR[riskBand] ?? "#4488ff" }}
                />
                <span className="text-[9px] uppercase tracking-wider text-white/40">
                  {riskBandLabel ?? riskBand}
                </span>
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            {price !== undefined ? (
              <>
                <p className="font-mono text-lg font-bold text-white">
                  {price.toFixed(2)}
                </p>
                <p
                  className="font-mono text-xs font-medium"
                  style={{ color }}
                  title={
                    changeInterval && changeInterval !== "Daily"
                      ? `Change over one ${changeInterval.toLowerCase().replace(/ly$/, "")} bar`
                      : "Change since the previous close"
                  }
                >
                  {isPositive ? "+" : ""}
                  {change?.toFixed(2)} ({isPositive ? "+" : ""}
                  {changePct?.toFixed(2)}%)
                </p>
                {/* Say so when the percentage is not today's move — on
                    "Monthly" it is a month-over-month change sitting in the
                    same spot a daily change normally occupies. */}
                {changeInterval && changeInterval !== "Daily" && (
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-white/30">
                    {changeInterval === "Weekly" ? "vs last week" : "vs last month"}
                  </p>
                )}
                {/* ALWAYS shown, in every state that has a price — the date
                    is the fact the reader is checking, and hiding it on live
                    cards meant a refresh replaced a dated figure with an
                    undated one.

                    It names the SESSION, not a clock time: the cron runs hours
                    after the 14:30 Cairo bell, so "as of 2 Sep, 22:33:28" read
                    as though the price were struck at 22:33 — wrong, and
                    precise to the second about a number that moves once a day.

                    "close" is appended only for a PAST session. Today's bar is
                    still moving while the market is open, so calling it a
                    close would be wrong for four and a half hours a day. */}
                {(asOf || fetchedAgo || marketClosed) && (
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-white/25">
                    {asOf}
                    {/* A closed-market bar is always a completed close, so the
                        "close" suffix applies even to today's session once the
                        14:30 Cairo bell has rung. */}
                    {asOf && (!isToday || marketClosed) && " close"}
                    {marketClosed ? (
                      // Market shut: freshness is meaningless — the price cannot
                      // move until it reopens. Say that rather than an age that
                      // climbs all weekend and reads as broken.
                      <>
                        {asOf && " · "}
                        Market closed
                      </>
                    ) : (
                      // The SESSION and the FETCH are different facts and the
                      // card needs both: "Sep 3" says which bar this is, "14s
                      // ago" says how fresh the number is. A card can sit on
                      // "Sep 3" all afternoon while the figure behind it is an
                      // hour old, and only the second half catches that.
                      <>
                        {asOf && fetchedAgo && " · "}
                        {fetchedAgo}
                      </>
                    )}
                  </p>
                )}
              </>
            ) : state === "loading" ? (
              <div className="animate-pulse space-y-1.5 py-1">
                <div className="h-5 w-16 rounded bg-white/10" />
                <div className="h-3 w-12 rounded bg-white/5" />
              </div>
            ) : state === "unavailable" ? (
              <p className="text-xs leading-tight text-white/35">
                No price feed
                <span className="mt-0.5 block text-[9px] text-white/25">
                  Not quoted by the data source
                </span>
              </p>
            ) : state === "failed" && onRetry ? (
              <button
                type="button"
                onClick={(e) => {
                  // The card is wrapped in a Link; without this, retrying
                  // navigates to the stock page instead.
                  e.preventDefault();
                  e.stopPropagation();
                  onRetry();
                }}
                className="min-h-[36px] rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-white/50 transition-colors hover:border-accent/40 hover:text-accent"
              >
                Couldn&apos;t load — retry
              </button>
            ) : (
              <p className="font-mono text-sm text-white/30">--</p>
            )}
          </div>

          {chartData.length > 1 && (
            <div className="h-8 w-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={sparkColor}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
