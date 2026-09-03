"use client";

import LearnTooltip from "./LearnTooltip";
import {
  CURRENT_DD_CAUTION,
  CURRENT_DD_NEUTRAL,
  DD_CAUTION,
  DD_GOOD,
  SHARPE_GOOD,
  SHARPE_OKAY,
  T_BILL_RATE_PCT,
} from "@/app/lib/constants";
import type { PortfolioMetrics } from "@/app/lib/types";

interface RiskDashboardProps {
  metrics: PortfolioMetrics;
}

function RiskMetric({
  label,
  value,
  tooltip,
  color,
  suffix,
}: {
  label: string;
  value: string;
  tooltip: { term: string; explanation: string };
  color?: string;
  suffix?: string;
}) {
  return (
    <div>
      <LearnTooltip term={tooltip.term} explanation={tooltip.explanation}>
        <p className="text-xs text-white/40">{label}</p>
      </LearnTooltip>
      <p className={`font-mono text-lg font-bold ${color || "text-white"}`}>
        {value}
      </p>
      {suffix && <p className="text-[10px] text-white/30">{suffix}</p>}
    </div>
  );
}

export default function RiskDashboard({ metrics }: RiskDashboardProps) {
  const sharpeColor =
    metrics.sharpe_ratio == null ? "text-white/30" :
    metrics.sharpe_ratio > SHARPE_GOOD ? "text-gain" :
    metrics.sharpe_ratio > SHARPE_OKAY ? "text-green-400" :
    metrics.sharpe_ratio > 0 ? "text-yellow-400" :
    "text-loss";

  const sortinoColor =
    metrics.sortino_ratio == null ? "text-white/30" :
    metrics.sortino_ratio > SHARPE_GOOD ? "text-gain" :
    metrics.sortino_ratio > 0 ? "text-yellow-400" :
    "text-loss";

  const ddValue = metrics.max_drawdown?.value;
  const ddColor =
    ddValue == null ? "text-white/30" :
    ddValue > DD_GOOD ? "text-gain" :
    ddValue > DD_CAUTION ? "text-yellow-400" :
    "text-loss";

  const currentDd = metrics.max_drawdown?.current_drawdown;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Risk Dashboard</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <RiskMetric
          label="Sharpe Ratio"
          value={metrics.sharpe_ratio != null ? metrics.sharpe_ratio.toFixed(2) : "--"}
          color={sharpeColor}
          tooltip={{
            term: "Sharpe Ratio",
            explanation: `Measures risk-adjusted return. Higher = better. A ratio > 1 means your returns strongly justify the risk. Below 0 means you would earn more in risk-free Egyptian cash (~${T_BILL_RATE_PCT}%).`,
          }}
        />
        <RiskMetric
          label="Sortino Ratio"
          value={metrics.sortino_ratio != null ? metrics.sortino_ratio.toFixed(2) : "--"}
          color={sortinoColor}
          tooltip={{
            term: "Sortino Ratio",
            explanation: "Like Sharpe but only counts downside risk, ignoring good volatility. A fairer measure if your stocks have had big upside swings.",
          }}
        />
        <RiskMetric
          label="Max Drawdown"
          value={ddValue != null ? `${(ddValue * 100).toFixed(1)}%` : "--"}
          color={ddColor}
          suffix={metrics.max_drawdown?.trough_date ? `on ${metrics.max_drawdown.trough_date}` : undefined}
          tooltip={{
            term: "Max Drawdown",
            explanation: "The largest peak-to-trough decline this mix of holdings would have gone through over the analysis window — at your current weights, including dates before you owned them. It measures how bumpy the mix is, not what your account actually did. Ask yourself: could I stomach this emotionally?",
          }}
        />
        {/* Both halves of this tile express the same loss. The EGP figure is
            an absolute magnitude while the backend's pct is a negative
            return, so without the abs() it read "12,480 EGP" over "-2.8%". */}
        <RiskMetric
          label="Daily VaR (95%)"
          value={metrics.var_95_egp != null ? `${metrics.var_95_egp.toLocaleString()} EGP` : "--"}
          suffix={metrics.var_95_pct != null ? `${Math.abs(metrics.var_95_pct * 100).toFixed(1)}% of portfolio` : undefined}
          tooltip={{
            term: "Value at Risk (VaR)",
            explanation: "On 95% of days, your portfolio won't lose more than this amount. On the worst 5% of days, losses could exceed this. Make sure you're comfortable with this number.",
          }}
        />
        <div>
          <LearnTooltip
            term="Current Drawdown"
            explanation="How far your portfolio is currently below its recent peak value. If 0%, you're at or near all-time highs. A negative value means you're in a drawdown."
          >
            <p className="text-xs text-white/40">Current Drawdown</p>
          </LearnTooltip>
          <p className={`font-mono text-lg font-bold ${
            currentDd == null ? "text-white/30" :
            currentDd > CURRENT_DD_NEUTRAL ? "text-gain" :
            currentDd > CURRENT_DD_CAUTION ? "text-yellow-400" :
            "text-loss"
          }`}>
            {currentDd != null ? `${(currentDd * 100).toFixed(1)}%` : "--"}
          </p>
          {currentDd != null && currentDd < CURRENT_DD_NEUTRAL && (
            <p className="text-[10px] text-yellow-400/60">Below peak</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[10px] text-white/25">
        Note: Egypt&apos;s risk-free rate is ~{T_BILL_RATE_PCT}%, which is very high globally. This makes it harder for stocks to have a positive Sharpe ratio compared to other markets.
      </p>
    </div>
  );
}
