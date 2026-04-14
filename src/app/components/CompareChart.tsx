"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

const COLORS = [
  "#4488ff",
  "#00ff88",
  "#ff3355",
  "#ffaa00",
  "#cc00ff",
  "#00ccff",
  "#ff6600",
  "#88ff00",
];

interface CompareChartProps {
  dates: string[];
  series: { symbol: string; values: (number | null)[] }[];
  height?: number;
}

export default function CompareChart({
  dates,
  series,
  height = 400,
}: CompareChartProps) {
  if (!dates.length || !series.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]" style={{ height }}>
        <p className="text-sm text-white/30">Select stocks to compare</p>
      </div>
    );
  }

  const data = dates.map((date, i) => {
    const point: Record<string, any> = { date };
    series.forEach((s) => {
      point[s.symbol] = s.values[i];
    });
    return point;
  });

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number, name: string) => [
              `${v?.toFixed(2)}%`,
              name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="line"
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
          {series.map((s, i) => (
            <Line
              key={s.symbol}
              type="monotone"
              dataKey={s.symbol}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
