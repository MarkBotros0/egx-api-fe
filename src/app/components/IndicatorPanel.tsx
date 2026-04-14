"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
} from "recharts";
import LearnTooltip from "./LearnTooltip";

interface IndicatorDataPoint {
  date: string;
  rsi?: number | null;
  macd_line?: number | null;
  macd_signal?: number | null;
  macd_histogram?: number | null;
  stochastic_k?: number | null;
  stochastic_d?: number | null;
  obv?: number | null;
}

interface IndicatorPanelProps {
  data: IndicatorDataPoint[];
}

const TABS = ["RSI", "MACD", "Stochastic", "OBV"] as const;
type Tab = (typeof TABS)[number];

function RSIChart({ data }: { data: IndicatorDataPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <LearnTooltip
          term="RSI — Relative Strength Index"
          explanation="Measures momentum on a 0-100 scale. Above 70 = overbought (may drop soon). Below 30 = oversold (may bounce). It helps you avoid buying at peaks or selling at bottoms."
        >
          <span className="text-xs font-medium text-white/60">RSI (14)</span>
        </LearnTooltip>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number) => [v?.toFixed(1), "RSI"]}
          />
          {/* Overbought / Oversold zones */}
          <ReferenceLine y={70} stroke="rgba(255,51,85,0.3)" strokeDasharray="3 3" />
          <ReferenceLine y={30} stroke="rgba(0,255,136,0.3)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#4488ff"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-between px-8 text-[10px] text-white/30">
        <span>Oversold (&lt;30)</span>
        <span>Overbought (&gt;70)</span>
      </div>
    </div>
  );
}

function MACDChart({ data }: { data: IndicatorDataPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <LearnTooltip
          term="MACD — Moving Average Convergence Divergence"
          explanation="Shows the relationship between two moving averages. When the MACD line crosses above the Signal line = bullish (buy signal). When it crosses below = bearish (sell signal). The histogram shows momentum strength."
        >
          <span className="text-xs font-medium text-white/60">MACD (12, 26, 9)</span>
        </LearnTooltip>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number, name: string) => [v?.toFixed(3), name]}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
          <Bar dataKey="macd_histogram" name="Histogram" radius={[1, 1, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  (d.macd_histogram ?? 0) >= 0
                    ? "rgba(0,255,136,0.4)"
                    : "rgba(255,51,85,0.4)"
                }
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="macd_line"
            stroke="#4488ff"
            strokeWidth={1.5}
            dot={false}
            name="MACD"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="macd_signal"
            stroke="#ff8800"
            strokeWidth={1}
            strokeDasharray="4 2"
            dot={false}
            name="Signal"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function StochasticChart({ data }: { data: IndicatorDataPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <LearnTooltip
          term="Stochastic Oscillator"
          explanation="Compares a stock's closing price to its price range over 14 days. Above 80 = overbought, below 20 = oversold. When %K crosses above %D from below 20, it's a buy signal."
        >
          <span className="text-xs font-medium text-white/60">Stochastic (14, 3)</span>
        </LearnTooltip>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 20, 50, 80, 100]}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number, name: string) => [v?.toFixed(1), name === "stochastic_k" ? "%K" : "%D"]}
          />
          <ReferenceLine y={80} stroke="rgba(255,51,85,0.3)" strokeDasharray="3 3" />
          <ReferenceLine y={20} stroke="rgba(0,255,136,0.3)" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="stochastic_k"
            stroke="#4488ff"
            strokeWidth={1.5}
            dot={false}
            name="stochastic_k"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="stochastic_d"
            stroke="#ff8800"
            strokeWidth={1}
            strokeDasharray="4 2"
            dot={false}
            name="stochastic_d"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-between px-8 text-[10px] text-white/30">
        <span>Oversold (&lt;20)</span>
        <span>Overbought (&gt;80)</span>
      </div>
    </div>
  );
}

function OBVChart({ data }: { data: IndicatorDataPoint[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <LearnTooltip
          term="OBV — On-Balance Volume"
          explanation="Adds volume on up days and subtracts on down days. Rising OBV confirms a price uptrend. Falling OBV during a price rise = warning (divergence)."
        >
          <span className="text-xs font-medium text-white/60">OBV</span>
        </LearnTooltip>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v: number) =>
              v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` :
              v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` :
              v <= -1e6 ? `${(v / 1e6).toFixed(1)}M` :
              v <= -1e3 ? `${(v / 1e3).toFixed(0)}K` :
              String(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number) => [v?.toLocaleString(), "OBV"]}
          />
          <Line
            type="monotone"
            dataKey="obv"
            stroke="#00ccff"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function IndicatorPanel({ data }: IndicatorPanelProps) {
  const [tab, setTab] = useState<Tab>("RSI");

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              tab === t
                ? "bg-accent/20 text-accent"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "RSI" && <RSIChart data={data} />}
      {tab === "MACD" && <MACDChart data={data} />}
      {tab === "Stochastic" && <StochasticChart data={data} />}
      {tab === "OBV" && <OBVChart data={data} />}
    </div>
  );
}
