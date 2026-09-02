"use client";

import { useState } from "react";
import { planSale, type SalePart } from "@/app/lib/positions";

export interface SellPosition {
  symbol: string;
  name: string;
  /** Every open lot of this symbol, in any order — the plan sorts. */
  lots: SalePart[];
}

interface SellHoldingFormProps {
  position: SellPosition;
  onSubmit: (data: {
    quantity: number;
    sell_price: number;
    sell_date: string;
    notes: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  /** Rejection from the API, rendered inside the form. On mobile the form
   *  fills the viewport, so a banner on the page behind it is invisible. */
  error?: string | null;
  /** Called on the first edit after a rejection so a stale message clears. */
  onDismissError?: () => void;
}

export default function SellHoldingForm({
  position,
  onSubmit,
  onCancel,
  error = null,
  onDismissError,
}: SellHoldingFormProps) {
  const held = position.lots.reduce((n, l) => n + l.quantity, 0);
  const cost = position.lots.reduce((n, l) => n + l.buy_price * l.quantity, 0);
  const avgBuyPrice = held > 0 ? cost / held : 0;
  const multiLot = position.lots.length > 1;

  // Pre-filled to the whole position: selling out entirely is the common case.
  const [quantity, setQuantity] = useState(held.toString());
  const [sellPrice, setSellPrice] = useState("");
  const [sellDate, setSellDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Every field edit clears the last rejection: the message described the
  // values that were submitted, not the ones now on screen.
  const edited = () => {
    if (error) onDismissError?.();
  };

  const qty = parseInt(quantity);
  const price = parseFloat(sellPrice);
  const validQty = Number.isFinite(qty) && qty > 0 && qty <= held;
  const validPrice = Number.isFinite(price) && price > 0;

  // Which purchases this sale consumes, oldest first. A preview — the backend
  // re-plans inside the transaction that writes the sale — but the P&L below
  // has to be summed over these parts, NOT computed off the average price:
  // selling 250 of a 200+45.20/100+41.00 position realizes what those
  // particular shares cost, and only a sale of the whole position makes the
  // two agree.
  const plan = validQty ? planSale(position.lots, qty) : [];
  const pnl =
    validQty && validPrice
      ? plan.reduce((n, part) => n + (price - part.buy_price) * part.quantity, 0)
      : null;
  const planCost = plan.reduce((n, part) => n + part.buy_price * part.quantity, 0);
  const pnlPct = pnl !== null && planCost > 0 ? (pnl / planCost) * 100 : null;

  // The backend rejects a sale dated before the purchase, so the picker must
  // not offer one — and with several lots the binding date is the NEWEST one
  // this sale reaches into.
  const earliestSellDate = plan.length
    ? plan.reduce((d, part) => (part.buy_date > d ? part.buy_date : d), "")
    : position.lots.reduce((d, l) => (l.buy_date < d || !d ? l.buy_date : d), "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validQty || !validPrice || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        quantity: qty,
        sell_price: price,
        sell_date: sellDate,
        notes,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
    >
      <h3 className="mb-1 text-sm font-medium text-white/70">
        Sell <span className="font-mono text-white">{position.symbol}</span>
      </h3>
      <p className="mb-4 text-xs text-white/40">
        {held} shares held
        {multiLot
          ? ` across ${position.lots.length} purchases · average ${avgBuyPrice.toFixed(2)} EGP`
          : ` · bought at ${avgBuyPrice.toFixed(2)} EGP`}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Quantity to sell *
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              edited();
            }}
            min={1}
            max={held}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
            required
          />
          <p className="mt-1 text-[10px] text-white/30">of {held} shares</p>
          {quantity !== "" && !validQty && (
            <p className="mt-1 text-[10px] text-loss/70">
              Enter between 1 and {held} shares
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">
            Sell Price (EGP) *
          </label>
          <input
            type="number"
            value={sellPrice}
            onChange={(e) => {
              setSellPrice(e.target.value);
              edited();
            }}
            min={0.01}
            // See AddHoldingForm: step=0.01 rejects EGX's three-decimal
            // quotes with the browser's own "Enter a valid value". A sell
            // price must accept exactly what the market printed.
            step="any"
            placeholder="95.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">Sell Date</label>
          <input
            type="date"
            value={sellDate}
            min={earliestSellDate || undefined}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setSellDate(e.target.value);
              edited();
            }}
            className="w-full min-w-0 appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
          />
          <p className="mt-1 text-[10px] text-white/30">
            {multiLot
              ? `On or after the newest purchase this sale reaches (${earliestSellDate || "unknown"})`
              : `On or after the buy date (${earliestSellDate || "unknown"})`}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              edited();
            }}
            placeholder="Why did you sell?"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
        </div>
      </div>

      {/* Which purchases this comes out of. Shown only when it spans more than
          one, and stated before the money so the split is confirmed rather
          than discovered afterwards in the closed-positions table — where it
          lands as one row per purchase, each keeping its own cost basis. */}
      {multiLot && plan.length > 0 && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <p className="text-xs text-white/40">
            Sold oldest first, from {plan.length === 1 ? "1 purchase" : `${plan.length} purchases`}
          </p>
          <ul className="mt-2 space-y-1">
            {plan.map((part) => (
              <li
                key={part.id}
                className="flex items-baseline justify-between gap-3 text-xs"
              >
                <span className="font-mono text-white/70">
                  {part.quantity} × {part.buy_price.toFixed(2)}
                </span>
                <span className="text-[10px] text-white/30">
                  bought {part.buy_date}
                </span>
                {validPrice && (
                  <span
                    className={`font-mono text-xs ${
                      price >= part.buy_price ? "text-gain" : "text-loss"
                    }`}
                  >
                    {price >= part.buy_price ? "+" : ""}
                    {((price - part.buy_price) * part.quantity).toLocaleString(
                      undefined,
                      { maximumFractionDigits: 0 }
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {pnl !== null && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <p className="text-xs text-white/40">This sale realizes</p>
          <p
            className={`font-mono text-lg font-semibold ${
              pnl >= 0 ? "text-gain" : "text-loss"
            }`}
          >
            {pnl >= 0 ? "+" : ""}
            {pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })} EGP
            {pnlPct !== null && (
              <span className="ml-2 text-sm">
                ({pnlPct >= 0 ? "+" : ""}
                {pnlPct.toFixed(2)}%)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Sits directly above the buttons so the rejection is on screen at the
          same place the user just tapped — the mobile form is a full-screen
          modal and a banner on the page behind it would never be seen. */}
      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-loss/30 bg-loss/10 p-3 text-xs text-loss"
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={!validQty || !validPrice || submitting}
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-charcoal-dark transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {submitting ? "Recording…" : "Record Sale"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
