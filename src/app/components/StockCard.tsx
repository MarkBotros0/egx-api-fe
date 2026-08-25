"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import SignalBadge from "./SignalBadge";
import type { CompositeSignal } from "../lib/types";

interface StockCardProps {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePct?: number;
  sparklineData?: number[];
  sector?: string;
  compositeSignal?: CompositeSignal | null;
  interval?: string;
  /**
   * Interval the price change covers. The dashboard's batch endpoint returns
   * a one-bar change on whatever interval is selected, so on "Monthly" the
   * percentage is month-over-month, not today's move.
   */
  changeInterval?: string;
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
  interval,
  changeInterval,
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

  return (
    <Link href={href}>
      <div className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.06] hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-mono text-sm font-semibold text-white">
              {symbol}
            </h3>
            <p className="mt-0.5 text-xs text-white/40 line-clamp-1">
              {name}
            </p>
          </div>
          {compositeSignal ? (
            <SignalBadge signal={compositeSignal} size="sm" />
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
              </>
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
