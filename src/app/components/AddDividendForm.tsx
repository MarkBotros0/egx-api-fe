"use client";

import { useState } from "react";

export interface DividendSymbolOption {
  symbol: string;
  name: string;
  sector: string;
  /** Shares currently held, when this came from an open holding. */
  shares?: number | null;
}

interface AddDividendFormProps {
  /** Symbols the user can pick from — open holdings AND past sales, so a
   *  dividend can be logged against a position already closed. */
  symbols: DividendSymbolOption[];
  presetSymbol?: string;
  onSubmit: (data: {
    symbol: string;
    name: string;
    sector: string;
    amount: number;
    pay_date: string;
    shares: number | null;
    notes: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  /** Rejection from the API, rendered inside the form. On mobile the form
   *  fills the viewport, so a banner on the page behind it is invisible. */
  error?: string | null;
  /** Called on the first edit after a rejection so a stale message clears. */
  onDismissError?: () => void;
}

export default function AddDividendForm({
  symbols,
  presetSymbol,
  onSubmit,
  onCancel,
  error = null,
  onDismissError,
}: AddDividendFormProps) {
  const [symbol, setSymbol] = useState(presetSymbol ?? symbols[0]?.symbol ?? "");
  const [amount, setAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [shares, setShares] = useState(() => {
    const preset = symbols.find((s) => s.symbol === presetSymbol);
    return preset?.shares != null ? String(preset.shares) : "";
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Every field edit clears the last rejection: the message described the
  // values that were submitted, not the ones now on screen.
  const edited = () => {
    if (error) onDismissError?.();
  };

  const picked = symbols.find((s) => s.symbol === symbol);
  const amountNum = parseFloat(amount);
  const sharesNum = shares.trim() === "" ? null : parseInt(shares, 10);

  const validAmount = Number.isFinite(amountNum) && amountNum > 0;
  const validShares =
    sharesNum === null || (Number.isFinite(sharesNum) && sharesNum > 0);
  const canSubmit = Boolean(symbol) && validAmount && validShares && !submitting;

  const perShare =
    validAmount && sharesNum ? amountNum / sharesNum : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        symbol,
        name: picked?.name ?? symbol,
        sector: picked?.sector ?? "",
        amount: amountNum,
        pay_date: payDate,
        shares: sharesNum,
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
      <h3 className="mb-1 text-sm font-medium text-white/70">Record a dividend</h3>
      <p className="mb-4 text-xs text-white/40">
        Cash the company paid you for holding it. Enter what actually landed in
        your account — already after the dividend tax.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-white/40">Stock *</label>
          <select
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              const next = symbols.find((s) => s.symbol === e.target.value);
              setShares(next?.shares != null ? String(next.shares) : "");
              edited();
            }}
            className="min-h-[44px] w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
            required
          >
            {!symbols.length && <option value="">No stocks yet</option>}
            {symbols.map((s) => (
              <option key={s.symbol} value={s.symbol} className="bg-charcoal">
                {s.symbol}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">
            Amount received (EGP) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              edited();
            }}
            min={0.01}
            step={0.01}
            placeholder="1200.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
            required
          />
          <p className="mt-1 text-[10px] text-white/30">
            The total that reached your account
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">Pay Date</label>
          {/* No `min`: a dividend is anchored to the stock, not to one
              purchase, so no buy date bounds it. `max` is today. */}
          <input
            type="date"
            value={payDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setPayDate(e.target.value);
              edited();
            }}
            className="w-full min-w-0 appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-white/40">
            Shares held (optional)
          </label>
          <input
            type="number"
            value={shares}
            onChange={(e) => {
              setShares(e.target.value);
              edited();
            }}
            min={1}
            placeholder="500"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
          <p className="mt-1 text-[10px] text-white/30">
            Only used to show a per-share figure
          </p>
        </div>

        <div className="md:col-span-2">
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
            placeholder="e.g. 2025 annual dividend"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
        </div>
      </div>

      {perShare !== null && (
        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.03] p-3">
          <p className="text-xs text-white/40">That works out to</p>
          <p className="font-mono text-lg font-semibold text-gain">
            {perShare.toFixed(2)} EGP per share
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
          disabled={!canSubmit}
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-charcoal-dark transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {submitting ? "Recording…" : "Record Dividend"}
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
