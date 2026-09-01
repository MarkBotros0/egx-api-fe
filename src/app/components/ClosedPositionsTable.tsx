"use client";

import { useState } from "react";
import type { Sale } from "../lib/types";

interface ClosedPositionsTableProps {
  sales: Sale[];
  riskFreeRatePct: number;
  onDelete: (id: string) => void;
}

function pnlClass(value: number): string {
  return value >= 0 ? "text-gain" : "text-loss";
}

function signed(value: number, digits = 0): string {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  })}`;
}

/** "Held 412 days · +3.9%/yr vs 25% T-bill", or null when too short to annualize. */
function tBillLine(sale: Sale, riskFreeRatePct: number): string | null {
  if (sale.annualized_return_pct === null) return null;
  const verdict = sale.beat_t_bill ? "beat" : "lost to";
  return `${signed(sale.annualized_return_pct, 1)}%/yr — ${verdict} the ${riskFreeRatePct.toFixed(
    0
  )}% T-bill`;
}

export default function ClosedPositionsTable({
  sales,
  riskFreeRatePct,
  onDelete,
}: ClosedPositionsTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    symbol: string;
  } | null>(null);

  if (!sales.length) return null;

  return (
    <>
      <details className="rounded-xl border border-white/5 bg-white/[0.02]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white/70 md:px-6">
          Closed Positions
          <span className="ml-2 text-xs text-white/30">({sales.length})</span>
        </summary>

        {/* Mobile cards */}
        <div className="space-y-3 px-4 pb-4 md:hidden">
          {sales.map((s) => {
            const line = tBillLine(s, riskFreeRatePct);
            return (
              <div key={s.id} className="rounded-lg bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium text-white">
                      {s.symbol}
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/30">
                      {s.quantity} shares · {s.buy_price.toFixed(2)} →{" "}
                      {s.sell_price.toFixed(2)} EGP
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-mono text-sm font-semibold ${pnlClass(s.realized_pnl)}`}>
                      {signed(s.realized_pnl)}
                    </p>
                    {s.realized_pnl_pct !== null && (
                      <p className="text-[10px] text-white/30">
                        {signed(s.realized_pnl_pct, 1)}%
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-white/30">
                  Sold {s.sell_date} · held {s.days_held} days
                </p>
                {line && <p className="mt-0.5 text-[10px] text-white/40">{line}</p>}
                <button
                  onClick={() => setConfirmDelete({ id: s.id, symbol: s.symbol })}
                  className="mt-2 min-h-[44px] w-full rounded-lg border border-white/10 text-xs text-white/40"
                >
                  Undo this sale
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto px-6 pb-4 md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="py-2 pr-4 font-medium">Symbol</th>
                <th className="py-2 pr-4 font-medium">Qty</th>
                <th className="py-2 pr-4 font-medium">Buy → Sell</th>
                <th className="py-2 pr-4 font-medium">Sold</th>
                <th className="py-2 pr-4 font-medium">Held</th>
                <th className="py-2 pr-4 font-medium">Realized</th>
                <th className="py-2 pr-4 font-medium">vs T-bill</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const line = tBillLine(s, riskFreeRatePct);
                return (
                  <tr key={s.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-mono text-white">{s.symbol}</td>
                    <td className="py-3 pr-4 font-mono text-white/60">{s.quantity}</td>
                    <td className="py-3 pr-4 font-mono text-white/60">
                      {s.buy_price.toFixed(2)} → {s.sell_price.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-white/40">{s.sell_date}</td>
                    <td className="py-3 pr-4 text-white/40">{s.days_held}d</td>
                    <td className={`py-3 pr-4 font-mono font-semibold ${pnlClass(s.realized_pnl)}`}>
                      {signed(s.realized_pnl)}
                      {s.realized_pnl_pct !== null && (
                        <span className="ml-1 text-xs font-normal text-white/30">
                          {signed(s.realized_pnl_pct, 1)}%
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-white/40">{line ?? "—"}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setConfirmDelete({ id: s.id, symbol: s.symbol })}
                        className="text-xs text-white/30 hover:text-white/60"
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-charcoal p-6">
            <p className="text-base font-semibold text-white">Undo this sale?</p>
            <p className="mt-2 text-sm text-white/50">
              The{" "}
              <span className="font-mono text-white/80">{confirmDelete.symbol}</span>{" "}
              sale will be removed from your winnings and the shares returned to
              your portfolio. If you deleted the holding itself, the shares
              cannot be restored.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-accent text-sm font-semibold text-charcoal-dark"
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
