"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MonteCarloResult } from "@/app/lib/types";

interface MonteCarloChartProps {
  data: MonteCarloResult;
}

export default function MonteCarloChart({ data }: MonteCarloChartProps) {
  const { percentiles, initial_value, days, probability_of_loss } = data;

  // Build chart data
  const chartData = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    p5: Math.round(initial_value * percentiles.p5[i]),
    p25: Math.round(initial_value * percentiles.p25[i]),
    p50: Math.round(initial_value * percentiles.p50[i]),
    p75: Math.round(initial_value * percentiles.p75[i]),
    p95: Math.round(initial_value * percentiles.p95[i]),
  }));

  const formatEGP = (v: number) =>
    v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
    v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` :
    String(v);

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Monte Carlo Simulation</h2>
      <p className="mb-4 text-xs text-white/40">
        1,000 simulated scenarios over {days} days based on your portfolio&apos;s historical behavior.
      </p>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            label={{ value: "Days", position: "insideBottom", offset: -5, fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={55}
            tickFormatter={formatEGP}
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
                p5: "Worst 5%", p25: "25th pctl", p50: "Median",
                p75: "75th pctl", p95: "Best 5%",
              };
              return [`${v.toLocaleString()} EGP`, labels[name] || name];
            }}
            labelFormatter={(day) => `Day ${day}`}
          />

          {/* Outer band: 5th-95th percentile */}
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

          {/* Inner band: 25th-75th percentile */}
          <Area
            type="monotone"
            dataKey="p75"
            stroke="none"
            fill="rgba(68,136,255,0.12)"
            name="p75"
          />
          <Area
            type="monotone"
            dataKey="p25"
            stroke="none"
            fill="rgba(10,10,15,1)"
            name="p25"
          />

          {/* Median line */}
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

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/40">Chance of Loss</p>
          <p className={`font-mono text-sm font-bold ${probability_of_loss > 0.5 ? "text-loss" : probability_of_loss > 0.3 ? "text-yellow-400" : "text-gain"}`}>
            {(probability_of_loss * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/40">Worst Case (5%)</p>
          <p className="font-mono text-sm font-bold text-loss">
            {((data.worst_case_5pct - 1) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/40">Median Outcome</p>
          <p className={`font-mono text-sm font-bold ${data.median >= 1 ? "text-gain" : "text-loss"}`}>
            {((data.median - 1) * 100).toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] text-white/40">Best Case (95%)</p>
          <p className="font-mono text-sm font-bold text-gain">
            +{((data.best_case_95pct - 1) * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
