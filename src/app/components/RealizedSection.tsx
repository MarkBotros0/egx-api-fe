"use client";

import { useState } from "react";
import LearnTooltip from "./LearnTooltip";
import type { Dividend, SaleOrder, SalesSummary } from "../lib/types";

/**
 * Everything already banked, in ONE section.
 *
 * This replaced three stacked cards — the Winnings headline, Closed Positions
 * and Dividends Received — which between them asked the reader to open three
 * separate disclosures to answer one question. The headline IS the section
 * header, so the number worth seeing at a glance stays visible while the two
 * ledgers sit behind a tap.
 *
 * They are TABS rather than two stacked lists because they are different
 * shapes: a sale has a buy price, a holding period and a verdict against cash;
 * a dividend has none of those. Stacking them invites reading one set of
 * columns as the other.
 *
 * Capital gains and dividends stay SEPARATE figures throughout. They are added
 * only in the one headline that says it is adding them — a dividend has no
 * cost basis and no holding period, so folding it into a return percentage
 * would silently change what "return" means mid-metric.
 */

interface RealizedSectionProps {
  summary: SalesSummary;
  orders: SaleOrder[];
  dividends: Dividend[];
  riskFreeRatePct: number;
  onDeleteSale: (id: string) => void;
  onDeleteDividend: (id: string) => void;
}

type Tab = "sales" | "dividends" | "by_symbol";

function egp(value: number, digits = 0): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function signed(value: number, digits = 0): string {
  return `${value >= 0 ? "+" : ""}${egp(value, digits)}`;
}

function pnlClass(value: number): string {
  return value >= 0 ? "text-gain" : "text-loss";
}

/**
 * "+3.9%/yr — beat the 19% T-bill", or a reason there is no such figure.
 *
 * An order spanning purchases made on different dates has NO single holding
 * period, so the backend sends null rather than inventing one. Saying which of
 * the two nulls this is matters: "held under 30 days" and "the parts ran for
 * different lengths" are different facts, and the second one has an answer
 * sitting one tap away inside the order.
 */
function tBillLine(order: SaleOrder): string | null {
  if (order.annualized_return_pct === null) {
    return order.lots_count > 1
      ? `Spans ${order.lots_count} purchases — see each below`
      : null;
  }
  const verdict = order.beat_t_bill ? "beat" : "lost to";
  const hurdle = order.t_bill_hurdle_pct;
  return `${signed(order.annualized_return_pct, 1)}%/yr — ${verdict} the ${
    hurdle !== null ? hurdle.toFixed(0) : "—"
  }% T-bill`;
}

/** The purchases one sell order reached into, each with its own basis. */
function OrderLots({ order }: { order: SaleOrder }) {
  return (
    <div className="mt-2 space-y-1.5 border-t border-white/5 pt-2">
      <p className="text-[10px] uppercase tracking-wide text-white/30">
        {order.lots_count} purchases sold, oldest first
      </p>
      {order.lots.map((lot) => (
        <div
          key={lot.id}
          className="flex items-center justify-between gap-3 text-[11px]"
        >
          <span className="text-white/50">
            {lot.quantity} bought {lot.buy_date} @{" "}
            <span className="font-mono">{lot.buy_price.toFixed(2)}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className={`font-mono ${pnlClass(lot.realized_pnl)}`}>
              {signed(lot.realized_pnl)}
            </span>
            {lot.annualized_return_pct !== null && (
              <span className="ml-1.5 text-white/30">
                {signed(lot.annualized_return_pct, 1)}%/yr
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RealizedSection({
  summary,
  orders,
  dividends,
  riskFreeRatePct,
  onDeleteSale,
  onDeleteDividend,
}: RealizedSectionProps) {
  // Open the tab that has something in it. Sales lead when both do — they are
  // the ledger with a verdict attached.
  const [tab, setTab] = useState<Tab>(
    orders.length ? "sales" : dividends.length ? "dividends" : "by_symbol"
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    kind: "sale" | "dividend";
    id: string;
    symbol: string;
    parts: number;
  } | null>(null);

  if (!orders.length && !dividends.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-white/40">Nothing banked yet</p>
        <p className="mt-1 text-xs text-white/30">
          Sell a holding or record a dividend and it will be tracked here.
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
  const dividendTotal = dividends.reduce((sum, d) => sum + d.amount, 0);

  const TABS: { key: Tab; label: string; count: number | null }[] = [
    { key: "sales", label: "Closed", count: orders.length },
    { key: "dividends", label: "Dividends", count: dividends.length },
    { key: "by_symbol", label: "By stock", count: null },
  ];

  return (
    <>
      {/* Collapsed by default, showing only the headline. `<details>` rather
          than useState: it renders collapsed on the server, so the card never
          flashes open before hydration. The state is deliberately NOT
          persisted — every visit starts collapsed.

          LearnTooltip is hover-only (no click handler), so having it inside the
          <summary> cannot swallow the toggle: on desktop hover explains and
          click expands, and on a phone there is no hover at all. */}
      <details className="group rounded-xl border border-white/5 bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 md:p-6">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-white/70">
              <LearnTooltip
                term="Realized Winnings"
                explanation="Money you have actually banked: profit from selling, plus any dividends the companies paid you. Unlike the P&L on your open holdings this cannot go back down — the trades are closed and the cash is received."
              >
                Realized Winnings
              </LearnTooltip>
            </h2>
            <p
              className={`mt-1 font-mono text-3xl font-bold md:text-4xl ${
                totalWinnings >= 0 ? "text-gain" : "text-loss"
              }`}
            >
              {signed(totalWinnings)} EGP
            </p>
            {totalDividends > 0 && (
              <p className="mt-1 font-mono text-xs text-white/50">
                {signed(summary.total_realized_pnl)} from sales
                <span className="mx-1.5 text-white/20">·</span>
                <span className="text-gain">{egp(totalDividends)}</span> in
                dividends
                <span className="ml-1 text-white/30">({dividendCount})</span>
              </p>
            )}
          </div>
          {/* The only affordance that the card opens — the default marker is
              removed by list-none, and a phone has no hover state to reveal
              one. */}
          <svg
            className="h-5 w-5 shrink-0 text-white/30 transition-transform group-open:rotate-180"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>

        <div className="px-4 pb-4 md:px-6 md:pb-6">
          {summary.total_realized_pnl_pct !== null && (
            <p className="mb-5 text-sm text-white/40">
              {signed(summary.total_realized_pnl_pct, 2)}% on{" "}
              {egp(summary.total_cost)} EGP invested in closed trades
            </p>
          )}

          {/* Support row */}
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/30">
                Record
              </p>
              <p className="mt-1 font-mono text-sm text-white">
                <span className="text-gain">{summary.win_count}W</span>
                {" / "}
                <span className="text-loss">{summary.loss_count}L</span>
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-wide text-white/30">
                Proceeds
              </p>
              <p className="mt-1 font-mono text-sm text-white">
                {egp(summary.total_proceeds)}
              </p>
            </div>
            {summary.best_trade && (
              <div className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-[10px] uppercase tracking-wide text-white/30">
                  Best
                </p>
                <p className="mt-1 font-mono text-sm text-gain">
                  {summary.best_trade.symbol}{" "}
                  {signed(summary.best_trade.realized_pnl)}
                </p>
              </div>
            )}
            {summary.worst_trade &&
              summary.worst_trade.id !== summary.best_trade?.id && (
                <div className="rounded-lg bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-white/30">
                    Worst
                  </p>
                  <p className="mt-1 font-mono text-sm text-loss">
                    {summary.worst_trade.symbol}{" "}
                    {signed(summary.worst_trade.realized_pnl)}
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
              closed trades beat the T-bill over the period you held them.
            </p>
          )}

          {/* Tab strip. 44px targets — this is the primary control of the
              section on a phone. */}
          <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-[44px] shrink-0 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  tab === t.key
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/10 text-white/50 hover:text-white/80"
                }`}
              >
                {t.label}
                {t.count !== null && (
                  <span className="ml-1.5 text-white/30">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "sales" && (
            <div className="space-y-2">
              {!orders.length && (
                <p className="py-4 text-center text-xs text-white/30">
                  No sales recorded yet.
                </p>
              )}
              {orders.map((o) => {
                const line = tBillLine(o);
                const isOpen = expanded === o.id;
                return (
                  <div key={o.id} className="rounded-lg bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-mono text-sm font-medium text-white">
                          <span className="shrink-0">{o.symbol}</span>
                          {/* The ticker is four opaque letters; the company
                              name is what the reader recognises. It truncates
                              rather than wrapping — the figure on the right is
                              what the row is for. */}
                          {o.name && o.name !== o.symbol && (
                            <span className="min-w-0 truncate font-sans text-xs font-normal text-white/40">
                              {o.name}
                            </span>
                          )}
                          {o.lots_count > 1 && (
                            <span className="shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 font-sans text-[10px] font-medium text-white/50">
                              {o.lots_count} lots
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          {o.quantity} shares sold @{" "}
                          {o.sell_price.toFixed(2)} EGP · {o.sell_date}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          {o.days_held !== null
                            ? `Held ${o.days_held} days`
                            : `Bought ${o.buy_date}${
                                o.buy_date_latest !== o.buy_date
                                  ? ` – ${o.buy_date_latest}`
                                  : ""
                              }`}
                        </p>
                        {line && (
                          <p className="mt-0.5 text-[10px] text-white/40">
                            {line}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`font-mono text-sm font-semibold ${pnlClass(
                            o.realized_pnl
                          )}`}
                        >
                          {signed(o.realized_pnl)}
                        </p>
                        {o.realized_pnl_pct !== null && (
                          <p className="text-[10px] text-white/30">
                            {signed(o.realized_pnl_pct, 1)}%
                          </p>
                        )}
                      </div>
                    </div>

                    {isOpen && o.lots_count > 1 && <OrderLots order={o} />}

                    <div className="mt-2 flex gap-2">
                      {o.lots_count > 1 && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : o.id)}
                          className="min-h-[44px] flex-1 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white/80"
                        >
                          {isOpen ? "Hide purchases" : "Show purchases"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setConfirm({
                            kind: "sale",
                            id: o.id,
                            symbol: o.symbol,
                            parts: o.lots_count,
                          })
                        }
                        className="min-h-[44px] flex-1 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/70"
                      >
                        Undo this sale
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "dividends" && (
            <div className="space-y-2">
              {!dividends.length && (
                <p className="py-4 text-center text-xs text-white/30">
                  No dividends recorded yet.
                </p>
              )}
              {dividends.length > 0 && (
                <p className="text-[10px] text-white/30">
                  {dividends.length} payment
                  {dividends.length === 1 ? "" : "s"} · {egp(dividendTotal)} EGP
                  received
                </p>
              )}
              {dividends.map((d) => (
                <div key={d.id} className="rounded-lg bg-white/[0.03] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-mono text-sm font-medium text-white">
                        <span className="shrink-0">{d.symbol}</span>
                        {d.name && d.name !== d.symbol && (
                          <span className="min-w-0 truncate font-sans text-xs font-normal text-white/40">
                            {d.name}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/30">
                        Paid {d.pay_date}
                        {d.amount_per_share !== null && (
                          <> · {d.amount_per_share.toFixed(2)} EGP/share</>
                        )}
                      </p>
                      {d.notes && (
                        <p className="mt-1 truncate text-[10px] text-white/30">
                          {d.notes}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-gain">
                      +{egp(d.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setConfirm({
                        kind: "dividend",
                        id: d.id,
                        symbol: d.symbol,
                        parts: 1,
                      })
                    }
                    className="mt-2 min-h-[44px] w-full rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/70"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === "by_symbol" && (
            <div className="space-y-2">
              {summary.by_symbol.map((s) => (
                <div
                  key={s.symbol}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-sm font-medium text-white">
                      <span className="shrink-0">{s.symbol}</span>
                      {s.name && s.name !== s.symbol && (
                        <span className="min-w-0 truncate font-sans text-xs font-normal text-white/40">
                          {s.name}
                        </span>
                      )}
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
                      className={`font-mono text-sm font-semibold ${pnlClass(
                        s.total_winnings
                      )}`}
                    >
                      {signed(s.total_winnings)}
                    </p>
                    {s.dividends > 0 && (
                      <p className="text-[10px] text-white/40">
                        incl. {egp(s.dividends)} dividends
                      </p>
                    )}
                    {s.dividends === 0 && s.realized_pnl_pct !== null && (
                      <p className="text-[10px] text-white/30">
                        {signed(s.realized_pnl_pct, 1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      {confirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirm(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-charcoal p-6">
            <p className="text-base font-semibold text-white">
              {confirm.kind === "sale"
                ? "Undo this sale?"
                : "Remove this dividend?"}
            </p>
            <p className="mt-2 text-sm text-white/50">
              {confirm.kind === "sale" ? (
                <>
                  The{" "}
                  <span className="font-mono text-white/80">
                    {confirm.symbol}
                  </span>{" "}
                  sale will be removed from your winnings and the shares
                  returned to your portfolio
                  {/* The order is one line on screen, so undo takes the whole
                      thing — say so, or "undo" reads as removing one part. */}
                  {confirm.parts > 1
                    ? `, across all ${confirm.parts} purchases it sold from`
                    : ""}
                  . If you deleted the holding itself, the shares cannot be
                  restored.
                </>
              ) : (
                <>
                  The{" "}
                  <span className="font-mono text-white/80">
                    {confirm.symbol}
                  </span>{" "}
                  dividend will be removed from your winnings. Your holdings are
                  not affected.
                </>
              )}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirm.kind === "sale") onDeleteSale(confirm.id);
                  else onDeleteDividend(confirm.id);
                  setConfirm(null);
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-accent text-sm font-semibold text-charcoal-dark"
              >
                {confirm.kind === "sale" ? "Undo" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
