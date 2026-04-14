"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import type { SupportLevel, FibonacciLevels } from "@/app/lib/types";

interface PriceDataPoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  sma_20?: number | null;
  sma_50?: number | null;
  sma_200?: number | null;
  ema_12?: number | null;
  ema_26?: number | null;
  bollinger_upper?: number | null;
  bollinger_middle?: number | null;
  bollinger_lower?: number | null;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  overlays?: {
    sma20?: boolean;
    sma50?: boolean;
    sma200?: boolean;
    ema12?: boolean;
    ema26?: boolean;
    bollinger?: boolean;
  };
  supports?: SupportLevel[];
  resistances?: SupportLevel[];
  fibonacci?: FibonacciLevels | null;
  height?: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-charcoal-dark/95 p-3 shadow-xl">
      <p className="mb-1 font-mono text-xs text-white/50">{label}</p>
      {payload.map((entry: any) => (
        <p
          key={entry.dataKey}
          className="font-mono text-xs"
          style={{ color: entry.color }}
        >
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(2) : "--"}
        </p>
      ))}
    </div>
  );
}

export default function PriceChart({
  data,
  overlays = {},
  supports,
  resistances,
  fibonacci,
  height = 400,
}: PriceChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]" style={{ height }}>
        <p className="text-sm text-white/30">No price data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            interval="preserveStartEnd"
            minTickGap={80}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Bollinger Bands — rendered as a shaded area */}
          {overlays.bollinger && (
            <>
              <Area
                type="monotone"
                dataKey="bollinger_upper"
                stroke="none"
                fill="rgba(68,136,255,0.08)"
                name="BB Upper"
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="bollinger_lower"
                stroke="none"
                fill="rgba(68,136,255,0.08)"
                name="BB Lower"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="bollinger_upper"
                stroke="rgba(68,136,255,0.3)"
                strokeWidth={1}
                dot={false}
                name="BB Upper"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="bollinger_lower"
                stroke="rgba(68,136,255,0.3)"
                strokeWidth={1}
                dot={false}
                name="BB Lower"
                connectNulls
              />
            </>
          )}

          {/* Price line */}
          <Line
            type="monotone"
            dataKey="close"
            stroke="#ffffff"
            strokeWidth={2.5}
            dot={false}
            name="Close"
          />

          {/* Moving average overlays */}
          {overlays.sma20 && (
            <Line
              type="monotone"
              dataKey="sma_20"
              stroke="#ffaa00"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
              name="SMA 20"
              connectNulls
            />
          )}
          {overlays.sma50 && (
            <Line
              type="monotone"
              dataKey="sma_50"
              stroke="#ff6600"
              strokeWidth={1}
              strokeDasharray="4 2"
              dot={false}
              name="SMA 50"
              connectNulls
            />
          )}
          {overlays.ema12 && (
            <Line
              type="monotone"
              dataKey="ema_12"
              stroke="#00ccff"
              strokeWidth={1}
              dot={false}
              name="EMA 12"
              connectNulls
            />
          )}
          {overlays.ema26 && (
            <Line
              type="monotone"
              dataKey="ema_26"
              stroke="#cc00ff"
              strokeWidth={1}
              dot={false}
              name="EMA 26"
              connectNulls
            />
          )}
          {overlays.sma200 && (
            <Line
              type="monotone"
              dataKey="sma_200"
              stroke="#ff0066"
              strokeWidth={1}
              strokeDasharray="6 3"
              dot={false}
              name="SMA 200"
              connectNulls
            />
          )}

          {/* Support levels */}
          {supports?.map((s, i) => (
            <ReferenceLine
              key={`support-${i}`}
              y={s.price}
              stroke="rgba(0,255,136,0.4)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `S ${s.price}`, position: "left", fontSize: 9, fill: "rgba(0,255,136,0.5)" }}
            />
          ))}

          {/* Resistance levels */}
          {resistances?.map((r, i) => (
            <ReferenceLine
              key={`resistance-${i}`}
              y={r.price}
              stroke="rgba(255,51,85,0.4)"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `R ${r.price}`, position: "left", fontSize: 9, fill: "rgba(255,51,85,0.5)" }}
            />
          ))}

          {/* Fibonacci levels */}
          {fibonacci && Object.entries(fibonacci.levels).map(([label, price]) => (
            <ReferenceLine
              key={`fib-${label}`}
              y={price}
              stroke="rgba(255,170,0,0.25)"
              strokeDasharray="2 4"
              strokeWidth={1}
              label={{ value: label, position: "right", fontSize: 8, fill: "rgba(255,170,0,0.4)" }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
