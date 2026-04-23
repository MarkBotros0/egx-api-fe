"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

import LearnTooltip from "./LearnTooltip";
import type { StockForecast } from "@/app/lib/types";

interface ForecastCardProps {
  forecast: StockForecast | null | undefined;
  symbol: string;
}

export default function ForecastCard({ forecast, symbol }: ForecastCardProps) {
  if (!forecast || (!forecast.expected_move && !forecast.monte_carlo)) {
    return null;
  }

  const { expected_move, monte_carlo } = forecast;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            <LearnTooltip
              term="Expected Move & Monte Carlo"
              explanation="A statistical range of plausible outcomes based on how this stock has historically behaved. NOT a prediction of direction."
            >
              <span>Expected Move & Forecast</span>
            </LearnTooltip>
          </h3>
          <p className="mt-0.5 text-[11px] text-white/40">
            Statistical ranges — not predictions.
          </p>
        </div>
        <Link
          href="/learn#expected_move"
          className="shrink-0 text-[10px] text-accent/70 hover:text-accent"
        >
          Learn →
        </Link>
      </div>

      {/* Expected-move band */}
      {expected_move && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <MoveTile
            label="Typical day"
            value={expected_move.daily_pct}
            confidenceNote="68% of days"
          />
          <MoveTile
            label="Typical week"
            value={expected_move.weekly_pct}
            confidenceNote="~5 trading days"
          />
          <MoveTile
            label="Typical month"
            value={expected_move.monthly_pct}
            confidenceNote="~22 trading days"
          />
        </div>
      )}

      {/* Monte Carlo cone */}
      {monte_carlo && <MonteCarloCone data={monte_carlo} symbol={symbol} />}

      <p className="mt-3 text-[10px] leading-relaxed text-white/30">
        Calculated from this stock&apos;s historical daily returns. Assumes
        volatility stays similar — a regime shift (news, crisis, earnings
        surprise) can push prices outside the cone.
      </p>
    </div>
  );
}

function MoveTile({
  label,
  value,
  confidenceNote,
}: {
  label: string;
  value: number;
  confidenceNote: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] text-white/40">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-white">
        ±{value.toFixed(1)}%
      </p>
      <p className="mt-0.5 text-[9px] text-white/30">{confidenceNote}</p>
    </div>
  );
}

function MonteCarloCone({
  data,
  symbol,
}: {
  data: NonNullable<StockForecast["monte_carlo"]>;
  symbol: string;
}) {
  const { percentiles, current_price, days } = data;

  // Prepend day 0 = current price so the cone anchors at today
  const chartData = [
    {
      day: 0,
      p5: current_price,
      p25: current_price,
      p50: current_price,
      p75: current_price,
      p95: current_price,
    },
    ...Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      p5: percentiles.p5[i],
      p25: percentiles.p25[i],
      p50: percentiles.p50[i],
      p75: percentiles.p75[i],
      p95: percentiles.p95[i],
    })),
  ];

  const finalP5 = percentiles.p5[days - 1];
  const finalP50 = percentiles.p50[days - 1];
  const finalP95 = percentiles.p95[days - 1];

  const formatPrice = (v: number) =>
    v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(2);

  return (
    <div>
      <p className="mb-2 text-[11px] text-white/50">
        {symbol} over the next {days} trading days — 1,000 simulated paths
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={formatPrice}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number, name: string) => {
              const labels: Record<string, string> = {
                p5: "Worst 5%",
                p25: "25th pctl",
                p50: "Median",
                p75: "75th pctl",
                p95: "Best 5%",
              };
              return [`${v.toFixed(2)} EGP`, labels[name] || name];
            }}
            labelFormatter={(day) => (day === 0 ? "Today" : `Day +${day}`)}
          />

          <ReferenceLine
            y={current_price}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="3 3"
          />

          <Area
            type="monotone"
            dataKey="p95"
            stroke="none"
            fill="rgba(68,136,255,0.08)"
            name="p95"
          />
          <Area
            type="monotone"
            dataKey="p5"
            stroke="none"
            fill="rgba(10,10,15,1)"
            name="p5"
          />
          <Area
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="rgba(68,136,255,0.15)"
            name="p75"
          />
          <Area
            type="monotone"
            dataKey="p25"
            stroke="none"
            fill="rgba(10,10,15,1)"
            name="p25"
          />
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#4488ff"
            strokeWidth={2}
            dot={false}
            name="p50"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-loss/[0.06] px-2 py-2">
          <p className="text-[10px] text-white/40">Bearish 5%</p>
          <p className="mt-0.5 font-mono text-xs font-bold text-loss">
            {finalP5.toFixed(2)}
          </p>
          <p className="text-[9px] text-white/30">
            {pctChange(finalP5, current_price)}
          </p>
        </div>
        <div className="rounded-lg bg-accent/[0.06] px-2 py-2">
          <p className="text-[10px] text-white/40">Median</p>
          <p
            className={`mt-0.5 font-mono text-xs font-bold ${
              finalP50 >= current_price ? "text-gain" : "text-loss"
            }`}
          >
            {finalP50.toFixed(2)}
          </p>
          <p className="text-[9px] text-white/30">
            {pctChange(finalP50, current_price)}
          </p>
        </div>
        <div className="rounded-lg bg-gain/[0.06] px-2 py-2">
          <p className="text-[10px] text-white/40">Bullish 5%</p>
          <p className="mt-0.5 font-mono text-xs font-bold text-gain">
            {finalP95.toFixed(2)}
          </p>
          <p className="text-[9px] text-white/30">
            {pctChange(finalP95, current_price)}
          </p>
        </div>
      </div>
    </div>
  );
}

function pctChange(future: number, current: number): string {
  if (current <= 0) return "";
  const pct = (future / current - 1) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}
