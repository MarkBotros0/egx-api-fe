"use client";

import LearnTooltip from "./LearnTooltip";
import type { AnalysisStats, CrossoverInfo, PEData } from "@/app/lib/types";

interface StatsPanelProps {
  stats: AnalysisStats;
  latestRsi?: number | null;
  latestVolatility?: number | null;
  cumulativeReturn?: number | null;
  beta?: number | null;
  atr?: number | null;
  atrPct?: number | null;
  crossovers?: CrossoverInfo | null;
  pe?: PEData | null;
}

function StatRow({
  label,
  value,
  tooltip,
  color,
}: {
  label: string;
  value: string;
  tooltip?: { term: string; explanation: string };
  color?: string;
}) {
  const labelContent = tooltip ? (
    <LearnTooltip term={tooltip.term} explanation={tooltip.explanation}>
      <span>{label}</span>
    </LearnTooltip>
  ) : (
    <span>{label}</span>
  );

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-white/50">{labelContent}</span>
      <span className={`font-mono text-xs font-medium ${color || "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

export default function StatsPanel({
  stats,
  latestRsi,
  latestVolatility,
  cumulativeReturn,
  beta,
  atr,
  atrPct,
  crossovers,
  pe,
}: StatsPanelProps) {
  const isPositive = stats.change_pct >= 0;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-sm font-medium text-white/70">Key Statistics</h3>

      {/* Crossover badge */}
      {crossovers?.current_signal && (
        <div className={`mb-3 rounded-lg px-3 py-2 text-center text-xs font-semibold ${
          crossovers.current_signal === "golden_cross"
            ? "bg-gain/10 text-gain border border-gain/20"
            : "bg-loss/10 text-loss border border-loss/20"
        }`}>
          {crossovers.current_signal === "golden_cross" ? "Golden Cross Active" : "Death Cross Active"}
          {crossovers.days_since_cross != null && (
            <span className="ml-1 font-normal opacity-60">({crossovers.days_since_cross}d ago)</span>
          )}
        </div>
      )}

      <div className="divide-y divide-white/5">
        <StatRow
          label="Current Price"
          value={`${stats.current_price.toFixed(2)} EGP`}
        />
        <StatRow
          label="Change"
          value={`${isPositive ? "+" : ""}${stats.change.toFixed(2)} (${isPositive ? "+" : ""}${stats.change_pct.toFixed(2)}%)`}
          color={isPositive ? "text-gain" : "text-loss"}
        />
        <StatRow
          label="52W High"
          value={`${stats.high_52w.toFixed(2)}`}
          tooltip={{
            term: "52-Week High",
            explanation:
              "The highest closing price in the last 252 trading days (~1 year). Stocks near their 52-week high have strong momentum but may face resistance.",
          }}
        />
        <StatRow
          label="52W Low"
          value={`${stats.low_52w.toFixed(2)}`}
          tooltip={{
            term: "52-Week Low",
            explanation:
              "The lowest closing price in the last year. Stocks near their 52-week low may be undervalued or may have fundamental problems — investigate before buying.",
          }}
        />
        <StatRow
          label="Avg Volume (20d)"
          value={formatVolume(stats.avg_volume)}
          tooltip={{
            term: "Average Volume",
            explanation:
              "The average number of shares traded per day over the last 20 days. Higher volume = more liquid (easier to buy/sell). Low volume stocks can be hard to exit quickly.",
          }}
        />
        {latestRsi != null && (
          <StatRow
            label="RSI (14)"
            value={latestRsi.toFixed(1)}
            tooltip={{
              term: "RSI",
              explanation:
                "Relative Strength Index. 0-100 scale. >70 = overbought, <30 = oversold. Helps gauge if a stock has moved too far too fast.",
            }}
            color={
              latestRsi > 70
                ? "text-loss"
                : latestRsi < 30
                  ? "text-gain"
                  : undefined
            }
          />
        )}
        {latestVolatility != null && (
          <StatRow
            label="Volatility (20d)"
            value={`${(latestVolatility * 100).toFixed(2)}%`}
            tooltip={{
              term: "Volatility",
              explanation:
                "Measures how much the price fluctuates day-to-day. High volatility = more risk but also more potential reward. Calculated as the standard deviation of daily returns.",
            }}
          />
        )}
        {cumulativeReturn != null && (
          <StatRow
            label="Cumulative Return"
            value={`${(cumulativeReturn * 100).toFixed(2)}%`}
            tooltip={{
              term: "Cumulative Return",
              explanation:
                "Total return since the first data point in the chart. Shows how much you would have gained or lost if you held from the beginning.",
            }}
            color={cumulativeReturn >= 0 ? "text-gain" : "text-loss"}
          />
        )}
        {beta != null && (
          <StatRow
            label="Beta"
            value={beta.toFixed(2)}
            tooltip={{
              term: "Beta vs EGX30",
              explanation:
                "Measures how much this stock moves relative to the EGX30 index. Beta > 1 = more volatile than market. Beta < 1 = less volatile. Beta = 1 = moves with the market.",
            }}
            color={
              beta > 1.3 ? "text-loss" : beta < 0.8 ? "text-gain" : undefined
            }
          />
        )}
        {atr != null && (
          <StatRow
            label="ATR (14)"
            value={`${atr.toFixed(2)}${atrPct != null ? ` (${atrPct}%)` : ""}`}
            tooltip={{
              term: "ATR — Average True Range",
              explanation:
                "Measures average daily price movement. Use it to set stop-losses: 1.5-2x ATR below your entry avoids being stopped out by normal noise.",
            }}
          />
        )}
        {pe && pe.pe_ratio != null && (
          <StatRow
            label="P/E Ratio"
            value={formatPE(pe)}
            tooltip={{
              term: "P/E Ratio",
              explanation:
                "Price-to-Earnings: how many EGP investors pay for every 1 EGP of annual profit. Egypt context: T-bills pay ~25% risk-free, so a P/E above 20 needs strong growth to be worth it versus cash.",
            }}
            color={peColor(pe.pe_ratio)}
          />
        )}
        {pe && pe.dividend_yield != null && pe.dividend_yield > 0 && (
          <StatRow
            label="Dividend Yield"
            value={`${pe.dividend_yield.toFixed(2)}%`}
            tooltip={{
              term: "Dividend Yield",
              explanation:
                "Annual dividends as a percentage of current share price. Compare to the 25% T-bill rate — a 3% dividend yield is small next to risk-free cash in Egypt.",
            }}
          />
        )}
      </div>
    </div>
  );
}

function formatPE(pe: PEData): string {
  const parts: string[] = [pe.pe_ratio!.toFixed(1)];
  if (pe.fetched_at) {
    parts.push(`as of ${pe.fetched_at.slice(0, 10)}`);
  }
  return parts[0] + (parts[1] ? ` · ${parts[1]}` : "");
}

function peColor(pe: number): string | undefined {
  if (pe < 0) return "text-loss";
  if (pe < 15) return "text-gain";
  if (pe > 30) return "text-loss";
  return undefined;
}

function formatVolume(v: number): string {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(0) + "K";
  return v.toString();
}
