"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface VolumeDataPoint {
  date: string;
  volume: number;
  close: number;
  open: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

function formatVolume(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
  return v.toString();
}

export default function VolumeChart({ data, height = 120 }: VolumeChartProps) {
  if (!data.length) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="mb-2 text-xs text-white/40">Volume</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            tickFormatter={formatVolume}
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(v: number) => [formatVolume(v), "Volume"]}
            labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}
          />
          <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.close >= d.open ? "rgba(0,255,136,0.5)" : "rgba(255,51,85,0.5)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
