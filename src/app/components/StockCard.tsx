"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { scoreColor } from "./CompositeGauge";
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
  interval?: string;
  /**
   * Interval the price change covers. The dashboard's batch endpoint returns
   * a one-bar change on whatever interval is selected, so on "Monthly" the
   * percentage is month-over-month, not today's move.
   */
  changeInterval?: string;
  state?: CardState;
  /** Human date the snapshot figures were measured, e.g. "2 Sep". */
  asOf?: string | null;
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
  interval,
  changeInterval,
  state = "live",
  asOf,
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
          {/* The score itself, not a Buy/Hold word. The number carries how
              strong the reading is - 61 and 79 are both "Buy" but they are
              not the same setup - and it matches the gauge on the detail
              page, so the two surfaces cannot appear to disagree. */}
          {compositeScore != null ? (
            <span
              className="flex shrink-0 flex-col items-center leading-none"
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
                {/* Say WHEN, whenever the figure is not from just now. The
                    snapshot is written after the close, so during trading
                    hours this price is a previous close and presenting it as
                    the current one would be a quiet lie. */}
                {state === "stale" && asOf && (
                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-white/25">
                    as of {asOf}
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
