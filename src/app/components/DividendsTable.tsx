"use client";

import { useState } from "react";
import type { Dividend } from "../lib/types";

interface DividendsTableProps {
  dividends: Dividend[];
  onDelete: (id: string) => void;
}

function egp(value: number, digits = 0): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function DividendsTable({
  dividends,
  onDelete,
}: DividendsTableProps) {
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    symbol: string;
  } | null>(null);

  if (!dividends.length) return null;

  const total = dividends.reduce((sum, d) => sum + d.amount, 0);

  return (
    <>
      <details className="rounded-xl border border-white/5 bg-white/[0.02]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-white/70 md:px-6">
          Dividends Received
          <span className="ml-2 text-xs text-white/30">
            ({dividends.length} · {egp(total)} EGP)
          </span>
        </summary>

        {/* Mobile cards */}
        <div className="space-y-3 px-4 pb-4 md:hidden">
          {dividends.map((d) => (
            <div key={d.id} className="rounded-lg bg-white/[0.03] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-white">
                    {d.symbol}
                  </p>
                  <p className="mt-0.5 text-[10px] text-white/30">
                    Paid {d.pay_date}
                    {d.amount_per_share !== null && (
                      <> · {d.amount_per_share.toFixed(2)} EGP/share</>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-gain">
                  +{egp(d.amount)}
                </p>
              </div>
              {d.notes && (
                <p className="mt-2 truncate text-[10px] text-white/30">{d.notes}</p>
              )}
              <button
                onClick={() => setConfirmDelete({ id: d.id, symbol: d.symbol })}
                className="mt-2 min-h-[44px] w-full rounded-lg border border-white/10 text-xs text-white/40"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto px-6 pb-4 md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-white/40">
                <th className="py-2 pr-4 font-medium">Symbol</th>
                <th className="py-2 pr-4 font-medium">Paid</th>
                <th className="py-2 pr-4 font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Per Share</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
                <th className="py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {dividends.map((d) => (
                <tr key={d.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 font-mono text-white">{d.symbol}</td>
                  <td className="py-3 pr-4 text-white/40">{d.pay_date}</td>
                  <td className="py-3 pr-4 font-mono font-semibold text-gain">
                    +{egp(d.amount)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-white/60">
                    {d.amount_per_share !== null
                      ? d.amount_per_share.toFixed(2)
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-white/40">
                    {d.notes || "—"}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() =>
                        setConfirmDelete({ id: d.id, symbol: d.symbol })
                      }
                      className="text-xs text-white/30 hover:text-white/60"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
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
            <p className="text-base font-semibold text-white">
              Remove this dividend?
            </p>
            <p className="mt-2 text-sm text-white/50">
              The{" "}
              <span className="font-mono text-white/80">
                {confirmDelete.symbol}
              </span>{" "}
              dividend will be removed from your winnings. Your holdings are not
              affected.
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
