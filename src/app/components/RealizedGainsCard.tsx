"use client";

import LearnTooltip from "./LearnTooltip";
import type { SalesSummary } from "../lib/types";

interface RealizedGainsCardProps {
  summary: SalesSummary;
  riskFreeRatePct: number;
}

function egp(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export default function RealizedGainsCard({
  summary,
  riskFreeRatePct,
}: RealizedGainsCardProps) {
  if (!summary.by_symbol.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-white/40">No sales recorded yet</p>
        <p className="mt-1 text-xs text-white/30">
          Sell a holding and your realized winnings will be tracked here.
        </p>
      </div>
    );
  }

  // Tolerate a body cached before dividends shipped (see public/sw.js
  // network-first-falls-back-to-cache): an old response has no
  // total_winnings/total_dividends at all, and `.toLocaleString` on
  // `undefined` would blank the whole page rather than degrade.
  const totalWinnings = summary.total_winnings ?? summary.total_realized_pnl;
  const totalDividends = summary.total_dividends ?? 0;
  const dividendCount = summary.dividend_count ?? 0;
  const positive = totalWinnings >= 0;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-6">
      <h2 className="mb-4 text-sm font-medium text-white/70">
        <LearnTooltip
          term="Realized Winnings"
          explanation="Money you have actually banked: profit from selling, plus any dividends the companies paid you. Unlike the P&L on your open holdings this cannot go back down — the trades are closed and the cash is received."
        >
          Realized Winnings
        </LearnTooltip>
      </h2>

      {/* Headline */}
      <div className="mb-5">
        <p
          className={`font-mono text-3xl font-bold md:text-4xl ${
            positive ? "text-gain" : "text-loss"
          }`}
        >
          {egp(totalWinnings)} EGP
        </p>
        {totalDividends > 0 && (
          <p className="mt-1 font-mono text-xs text-white/50">
            {egp(summary.total_realized_pnl)} from sales
            <span className="mx-1.5 text-white/20">·</span>
            <span className="text-gain">
              {totalDividends.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>{" "}
            in dividends
            <span className="ml-1 text-white/30">
              ({dividendCount})
            </span>
          </p>
        )}
        {summary.total_realized_pnl_pct !== null && (
          <p className="mt-1 text-sm text-white/40">
            {summary.total_realized_pnl_pct >= 0 ? "+" : ""}
            {summary.total_realized_pnl_pct.toFixed(2)}% on{" "}
            {summary.total_cost.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{" "}
            EGP invested in closed trades
          </p>
        )}
      </div>

      {/* Support row */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/30">Record</p>
          <p className="mt-1 font-mono text-sm text-white">
            <span className="text-gain">{summary.win_count}W</span>
            {" / "}
            <span className="text-loss">{summary.loss_count}L</span>
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wide text-white/30">Proceeds</p>
          <p className="mt-1 font-mono text-sm text-white">
            {summary.total_proceeds.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        {summary.best_trade && (
          <div className="rounded-lg bg-white/[0.03] p-3">
            <p className="text-[10px] uppercase tracking-wide text-white/30">Best</p>
            <p className="mt-1 font-mono text-sm text-gain">
              {summary.best_trade.symbol} {egp(summary.best_trade.realized_pnl)}
            </p>
          </div>
        )}
        {summary.worst_trade &&
          summary.worst_trade.id !== summary.best_trade?.id && (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/30">Worst</p>
              <p className="mt-1 font-mono text-sm text-loss">
                {summary.worst_trade.symbol} {egp(summary.worst_trade.realized_pnl)}
              </p>
            </div>
          )}
      </div>

      {/* T-bill context. A fact, not an aggregate — annualized returns over
          trades of different lengths cannot honestly be averaged. */}
      {summary.annualizable_count > 0 && (
        <p className="mb-5 text-xs text-white/40">
          <LearnTooltip
            term="Versus risk-free cash"
            explanation={`Egypt's T-bill rate is about ${riskFreeRatePct.toFixed(
              0
            )}% — the highest risk-free rate of any major market. A gain that took years to earn can still be worth less than leaving the money in T-bills over the same period. Trades held under 30 days are excluded, because annualizing a few days of return produces nonsense.`}
          >
            {summary.beat_t_bill_count} of {summary.annualizable_count}
          </LearnTooltip>{" "}
          closed trades beat the {riskFreeRatePct.toFixed(0)}% T-bill over the
          period you held them.
        </p>
      )}

      {/* Per-stock breakdown */}
      <div>
        <p className="mb-2 text-xs font-medium text-white/50">By stock</p>
        <div className="space-y-2">
          {summary.by_symbol.map((s) => (
            <div
              key={s.symbol}
              className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium text-white">
                  {s.symbol}
                </p>
                <p className="truncate text-[10px] text-white/30">
                  {s.sales_count === 0
                    ? "Dividends only — not sold"
                    : `${s.quantity} shares · ${s.sales_count} ${
                        s.sales_count === 1 ? "sale" : "sales"
                      }`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-mono text-sm font-semibold ${
                    s.total_winnings >= 0 ? "text-gain" : "text-loss"
                  }`}
                >
                  {egp(s.total_winnings)}
                </p>
                {s.dividends > 0 && (
                  <p className="text-[10px] text-white/40">
                    incl.{" "}
                    {s.dividends.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    dividends
                  </p>
                )}
                {s.dividends === 0 && s.realized_pnl_pct !== null && (
                  <p className="text-[10px] text-white/30">
                    {s.realized_pnl_pct >= 0 ? "+" : ""}
                    {s.realized_pnl_pct.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
