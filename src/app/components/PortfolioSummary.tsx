"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import LearnTooltip from "./LearnTooltip";
import CompositeGauge from "./CompositeGauge";
import { scoreColor } from "./CompositeGauge";
import type { PortfolioMetrics } from "@/app/lib/types";

const PIE_COLORS = [
  "#4488ff", "#00ff88", "#ff3355", "#ffaa00", "#cc00ff",
  "#00ccff", "#ff6600", "#88ff00", "#ff00aa", "#aabb00",
];

interface PortfolioSummaryProps {
  metrics: PortfolioMetrics;
}

export default function PortfolioSummary({ metrics }: PortfolioSummaryProps) {
  const isPositive = metrics.total_pnl >= 0;

  const sectorData = Object.entries(metrics.sector_allocation).map(
    ([name, value]) => ({ name, value })
  );

  const divColor =
    metrics.diversification_score >= 70
      ? "text-gain"
      : metrics.diversification_score >= 40
        ? "text-yellow-400"
        : "text-loss";

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Portfolio Summary</h2>

      {/* Totals cover only the holdings we could price. Saying so is
          essential: silently dropping one used to leave its cost basis in
          total_invested with no matching value, showing a large phantom
          loss with nothing on screen to explain it. */}
      {metrics.excluded_count > 0 && (
        <div className="mb-4 rounded-lg border border-[#ffaa00]/30 bg-[#ffaa00]/[0.06] px-3 py-2">
          <p className="text-xs text-[#ffaa00]">
            {metrics.excluded_count} holding{metrics.excluded_count > 1 ? "s" : ""}{" "}
            could not be priced and{" "}
            {metrics.excluded_count > 1 ? "are" : "is"} left out of these totals
            {metrics.excluded_invested > 0 && (
              <>
                {" "}
                ({metrics.excluded_invested.toLocaleString("en", { maximumFractionDigits: 0 })}{" "}
                EGP of cost basis)
              </>
            )}
            . The figures below describe the rest of your portfolio.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <p className="text-xs text-white/40">Total Value</p>
          <p className="font-mono text-xl font-bold text-white">
            {metrics.total_value.toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-white/30">EGP</p>
        </div>

        <div>
          <p className="text-xs text-white/40">Total P&L</p>
          <p className={`font-mono text-xl font-bold ${isPositive ? "text-gain" : "text-loss"}`}>
            {isPositive ? "+" : ""}{metrics.total_pnl.toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
          <p className={`font-mono text-xs ${isPositive ? "text-gain/70" : "text-loss/70"}`}>
            {isPositive ? "+" : ""}{metrics.total_pnl_pct.toFixed(2)}%
          </p>
        </div>

        <div>
          <LearnTooltip
            term="Diversification Score"
            explanation="A 0-100 score measuring how well-spread your investments are across different stocks and sectors. Higher = better diversified = lower risk. The score starts dropping at the same points that trigger a concentration warning: any single stock above 35%, or any sector above 40%, of your portfolio."
          >
            <p className="text-xs text-white/40">Diversification</p>
          </LearnTooltip>
          <p className={`font-mono text-xl font-bold ${divColor}`}>
            {metrics.diversification_score.toFixed(0)}
          </p>
          <p className="text-xs text-white/30">/100</p>
        </div>

        {metrics.avg_composite_score != null && (
          <div>
            <LearnTooltip
              term="Avg Composite Score"
              explanation="Value-weighted average composite score across your holdings, so bigger positions count for more. 0-100, blending 8 categories: trend, momentum, volume, volatility, divergence, quality, risk-adjusted return and relative strength. It summarises the current technical condition of what you hold — it is not a forecast of how the portfolio will perform."
            >
              <p className="text-xs text-white/40">Avg Score</p>
            </LearnTooltip>
            <div className="flex items-center gap-2 mt-1">
              <CompositeGauge score={metrics.avg_composite_score} signal={null} size="sm" />
              <p className="font-mono text-xl font-bold" style={{ color: scoreColor(metrics.avg_composite_score) }}>
                {metrics.avg_composite_score.toFixed(0)}
              </p>
            </div>
            <p className="text-xs text-white/30">/100</p>
          </div>
        )}
      </div>

      {/* Sector allocation */}
      {sectorData.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs text-white/40">Sector Allocation</p>

          {/* Mobile: horizontal stacked bar */}
          <div className="md:hidden">
            {/* Stacked bar */}
            <div className="mb-3 flex h-4 overflow-hidden rounded-full">
              {sectorData.map((s, i) => (
                <div
                  key={s.name}
                  className="h-full"
                  style={{
                    width: `${s.value}%`,
                    backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    minWidth: s.value > 0 ? "4px" : "0",
                  }}
                />
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {sectorData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-xs text-white/50">
                    {s.name} ({s.value.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: donut chart */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2">
              {sectorData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-[10px] text-white/50">
                    {s.name} ({s.value.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
