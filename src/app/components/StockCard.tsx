"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import CompositeGauge from "./CompositeGauge";
import type { CompositeSignal } from "../lib/types";

interface StockCardProps {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePct?: number;
  sparklineData?: number[];
  sector?: string;
  compositeScore?: number | null;
  compositeSignal?: CompositeSignal | null;
  interval?: string;
}

export default function StockCard({
  symbol,
  name,
  price,
  change,
  changePct,
  sparklineData,
  sector,
  compositeScore,
  compositeSignal,
  interval,
}: StockCardProps) {
  const isPositive = (changePct ?? 0) >= 0;
  const color = isPositive ? "#00ff88" : "#ff3355";

  const chartData = sparklineData?.map((v, i) => ({ i, v })) ?? [];
  const hasComposite = compositeScore !== undefined && compositeScore !== null;
  const href = interval
    ? `/stock/${symbol}?interval=${encodeURIComponent(interval)}`
    : `/stock/${symbol}`;

  return (
    <Link href={href}>
      <div className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.06] hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-mono text-sm font-semibold text-white">
              {symbol}
            </h3>
            <p className="mt-0.5 text-xs text-white/40 line-clamp-1">
              {name}
            </p>
          </div>
          {hasComposite ? (
            <CompositeGauge
              score={compositeScore}
              signal={compositeSignal}
              size="sm"
            />
          ) : sector ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent/70">
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
                >
                  {isPositive ? "+" : ""}
                  {change?.toFixed(2)} ({isPositive ? "+" : ""}
                  {changePct?.toFixed(2)}%)
                </p>
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
                    stroke={color}
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
