"use client";

import { useMemo } from "react";
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

import Link from "next/link";

import type { SupportLevel, FibonacciLevels, TrendLine, TrendLines } from "@/app/lib/types";

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
  trend_support?: number | null;
  trend_resistance?: number | null;
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
    trendlines?: boolean;
  };
  supports?: SupportLevel[];
  resistances?: SupportLevel[];
  fibonacci?: FibonacciLevels | null;
  trendlines?: TrendLines | null;
  height?: number;
}

// Support-green and resistance-red, the same convention the horizontal S/R
// lines below already use. Slightly stronger than those so a diagonal reads
// as a drawn line rather than a stray gridline.
const TREND_SUPPORT_STROKE = "rgba(0,255,136,0.7)";
const TREND_RESISTANCE_STROKE = "rgba(255,51,85,0.7)";

/**
 * Dots only where the line actually rests on a pivot. Recharts calls this
 * for EVERY point on the series and its typing insists on an element back,
 * so a non-anchor bar gets an empty <g/> and draws nothing. The line then
 * carries exactly as many dots as it has anchors — the reader can see WHY
 * the line is where it is, which is the whole difference between an
 * auto-drawn trendline and a decoration.
 */
function anchorDot(line: TrendLine, stroke: string) {
  const anchorDates = new Set(line.anchors.map((a) => a.date));
  const AnchorDot = (props: any) => {
    const { cx, cy, payload, index } = props;
    if (cx == null || cy == null || !anchorDates.has(payload?.date)) {
      return <g key={`anchor-${index}`} />;
    }
    return (
      <circle
        key={`anchor-${index}`}
        cx={cx}
        cy={cy}
        r={3.5}
        fill="#0a0a0f"
        stroke={stroke}
        strokeWidth={1.5}
      />
    );
  };
  return AnchorDot;
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
  trendlines,
  height = 400,
}: PriceChartProps) {
  const trendSupport = overlays.trendlines ? trendlines?.support ?? null : null;
  const trendResistance = overlays.trendlines ? trendlines?.resistance ?? null : null;
  const supportDot = useMemo(
    () => (trendSupport ? anchorDot(trendSupport, TREND_SUPPORT_STROKE) : undefined),
    [trendSupport],
  );
  const resistanceDot = useMemo(
    () => (trendResistance ? anchorDot(trendResistance, TREND_RESISTANCE_STROKE) : undefined),
    [trendResistance],
  );

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

          {/* Bollinger Bands — shaded envelope.
              Recharts fills an Area from the chart FLOOR, not from a
              companion series, so two translucent Areas stacked up painted
              the region BELOW the lower band twice (darkest) and the actual
              envelope once. Price breaking below the lower band looked like
              it was inside the band — the opposite of the oversold read the
              overlay exists to give. Fix: paint the upper Area, then erase
              everything under the lower band with an opaque fill in the page
              background colour (the same technique MonteCarloChart and
              ForecastCard use for their cones). Order matters. */}
          {overlays.bollinger && (
            <>
              <Area
                type="monotone"
                dataKey="bollinger_upper"
                stroke="none"
                fill="rgba(68,136,255,0.10)"
                name="BB Upper"
                connectNulls
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="bollinger_lower"
                stroke="none"
                fill="#0a0a0f"
                fillOpacity={1}
                name="BB Lower"
                connectNulls
                isAnimationActive={false}
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

          {/* Trendlines — the diagonal through the last three pivot lows /
              highs, extended to the last bar. A side is rendered only when
              the backend drew it, so a stock with no clean trend adds no
              "--" rows to the tooltip. `type="linear"` because it IS a
              straight line; a monotone spline would bow it between the
              anchors it is supposed to rest on. Values are null before the
              first anchor, and nothing is drawn there. */}
          {trendSupport && (
            <Line
              type="linear"
              dataKey="trend_support"
              stroke={TREND_SUPPORT_STROKE}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={supportDot}
              activeDot={false}
              name="Trend support"
              isAnimationActive={false}
            />
          )}
          {trendResistance && (
            <Line
              type="linear"
              dataKey="trend_resistance"
              stroke={TREND_RESISTANCE_STROKE}
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={resistanceDot}
              activeDot={false}
              name="Trend resistance"
              isAnimationActive={false}
            />
          )}

          {/* Support / resistance / Fibonacci levels.
              `ifOverflow="extendDomain"` is required: these levels are derived
              from the full ~400-bar history while the chart plots only the
              selected bar count, and Recharts DISCARDS reference lines outside
              the axis domain by default. Levels named in the Key Levels card
              were silently missing from the chart below it. */}
          {supports?.map((s, i) => (
            <ReferenceLine
              key={`support-${i}`}
              y={s.price}
              stroke="rgba(0,255,136,0.4)"
              strokeDasharray="4 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={{ value: `S ${s.price.toFixed(2)}`, position: "left", fontSize: 9, fill: "rgba(0,255,136,0.5)" }}
            />
          ))}

          {resistances?.map((r, i) => (
            <ReferenceLine
              key={`resistance-${i}`}
              y={r.price}
              stroke="rgba(255,51,85,0.4)"
              strokeDasharray="4 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={{ value: `R ${r.price.toFixed(2)}`, position: "left", fontSize: 9, fill: "rgba(255,51,85,0.5)" }}
            />
          ))}

          {fibonacci && Object.entries(fibonacci.levels).map(([label, price]) => (
            <ReferenceLine
              key={`fib-${label}`}
              y={price}
              stroke="rgba(255,170,0,0.25)"
              strokeDasharray="2 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={{ value: label, position: "right", fontSize: 8, fill: "rgba(255,170,0,0.4)" }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Says what was drawn and, just as important, what was not: a chart
          with the overlay on and no line is a stock whose pivots do not line
          up, not a chart that forgot. */}
      {overlays.trendlines && (
        <p className="mt-2 text-[10px] leading-relaxed text-white/30">
          {trendSupport || trendResistance ? (
            <>
              Trendline through the last 3 pivot{" "}
              {trendSupport && (
                <span style={{ color: TREND_SUPPORT_STROKE }}>
                  lows ({trendSupport.direction === "up" ? "rising" : "falling"})
                </span>
              )}
              {trendSupport && trendResistance && " and "}
              {trendResistance && (
                <span style={{ color: TREND_RESISTANCE_STROKE }}>
                  highs ({trendResistance.direction === "up" ? "rising" : "falling"})
                </span>
              )}
              , dots mark the anchors.
            </>
          ) : (
            <>No trendline: the last 3 pivots do not line up, or price has not respected the line.</>
          )}{" "}
          <Link href="/learn#trendlines" className="text-accent/60 hover:text-accent">
            Learn more →
          </Link>
        </p>
      )}
    </div>
  );
}
