"use client";

import { useState } from "react";

interface SellHoldingFormProps {
  holding: {
    symbol: string;
    name: string;
    quantity: number;
    buy_price: number;
    buy_date: string;
  };
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
  holding,
  onSubmit,
  onCancel,
  error = null,
  onDismissError,
}: SellHoldingFormProps) {
  // Pre-filled to the whole position: selling out entirely is the common case.
  const [quantity, setQuantity] = useState(holding.quantity.toString());
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
  const validQty = Number.isFinite(qty) && qty > 0 && qty <= holding.quantity;
  const validPrice = Number.isFinite(price) && price > 0;

  // Live preview so the number is confirmed before saving, not after.
  const pnl = validQty && validPrice ? (price - holding.buy_price) * qty : null;
  const pnlPct =
    validPrice && holding.buy_price > 0
      ? (price / holding.buy_price - 1) * 100
      : null;

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
        Sell <span className="font-mono text-white">{holding.symbol}</span>
      </h3>
      <p className="mb-4 text-xs text-white/40">
        Bought at {holding.buy_price.toFixed(2)} EGP · {holding.quantity} shares held
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
            max={holding.quantity}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
            required
          />
          <p className="mt-1 text-[10px] text-white/30">
            of {holding.quantity} shares
          </p>
          {quantity !== "" && !validQty && (
            <p className="mt-1 text-[10px] text-loss/70">
              Enter between 1 and {holding.quantity} shares
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
          {/* `min` is the buy date: the backend rejects a sale dated before
              the purchase, so the picker should not offer one. */}
          <input
            type="date"
            value={sellDate}
            min={holding.buy_date || undefined}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setSellDate(e.target.value);
              edited();
            }}
            className="w-full min-w-0 appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
          />
          <p className="mt-1 text-[10px] text-white/30">
            On or after the buy date ({holding.buy_date || "unknown"})
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
