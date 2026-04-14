"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { validateTicker } from "@/app/lib/api";
import type { Ticker } from "@/app/lib/types";

interface AddHoldingFormProps {
  tickers: Ticker[];
  onSubmit: (data: {
    symbol: string;
    name: string;
    sector: string;
    buy_price: number;
    buy_date: string;
    quantity: number;
    target_price: number | null;
    stop_loss: number | null;
    notes: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  initialValues?: {
    symbol?: string;
    buy_price?: number;
    buy_date?: string;
    quantity?: number;
    target_price?: number | null;
    stop_loss?: number | null;
    notes?: string;
  };
}

type ValidationState = "idle" | "validating" | "valid" | "invalid" | "error";

export default function AddHoldingForm({
  tickers,
  onSubmit,
  onCancel,
  initialValues,
}: AddHoldingFormProps) {
  const [search, setSearch] = useState(initialValues?.symbol || "");
  const [selectedTicker, setSelectedTicker] = useState<Ticker | null>(
    initialValues?.symbol
      ? tickers.find((t) => t.symbol === initialValues.symbol) || null
      : null
  );
  const [validatedTicker, setValidatedTicker] = useState<{ symbol: string; name: string; sector: string } | null>(
    initialValues?.symbol
      ? { symbol: initialValues.symbol, name: initialValues.symbol, sector: "Unknown" }
      : null
  );
  const [validation, setValidation] = useState<ValidationState>(
    initialValues?.symbol ? "valid" : "idle"
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [buyPrice, setBuyPrice] = useState(initialValues?.buy_price?.toString() || "");
  const [buyDate, setBuyDate] = useState(
    initialValues?.buy_date || new Date().toISOString().slice(0, 10)
  );
  const [quantity, setQuantity] = useState(initialValues?.quantity?.toString() || "");
  const [targetPrice, setTargetPrice] = useState(
    initialValues?.target_price?.toString() || ""
  );
  const [stopLoss, setStopLoss] = useState(
    initialValues?.stop_loss?.toString() || ""
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const validateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    if (!search) return tickers.slice(0, 10);
    const q = search.toLowerCase();
    return tickers
      .filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [search, tickers]);

  // When user types a symbol not in the dropdown, validate it after 600ms pause
  useEffect(() => {
    if (selectedTicker) return; // already resolved via dropdown
    const sym = search.trim().toUpperCase();
    if (!sym) {
      setValidation("idle");
      setValidatedTicker(null);
      return;
    }

    // Check if it matches a known ticker exactly
    const known = tickers.find((t) => t.symbol.toUpperCase() === sym);
    if (known) {
      setValidation("valid");
      setValidatedTicker({ symbol: known.symbol, name: known.name, sector: known.sector });
      return;
    }

    // Otherwise debounce a remote validation call
    if (validateTimer.current) clearTimeout(validateTimer.current);
    setValidation("validating");
    validateTimer.current = setTimeout(async () => {
      try {
        const data = await validateTicker(sym);
        if (data.valid === true) {
          setValidation("valid");
          setValidatedTicker({ symbol: sym, name: data.name || sym, sector: "Unknown" });
        } else if (data.valid === false) {
          setValidation("invalid");
          setValidatedTicker(null);
        } else {
          // Network inconclusive — let the user proceed; analysis will fail gracefully
          setValidation("error");
          setValidatedTicker({ symbol: sym, name: sym, sector: "Unknown" });
        }
      } catch {
        setValidation("error");
        setValidatedTicker({ symbol: sym, name: sym, sector: "Unknown" });
      }
    }, 600);

    return () => {
      if (validateTimer.current) clearTimeout(validateTimer.current);
    };
  }, [search, selectedTicker, tickers]);

  // The effective ticker is either a dropdown pick or a remote-validated entry
  const effectiveTicker = selectedTicker ?? (
    (validation === "valid" || validation === "error") ? validatedTicker : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveTicker || submitting || validation === "validating" || validation === "invalid") return;

    setSubmitting(true);
    try {
      await onSubmit({
        symbol: effectiveTicker.symbol,
        name: effectiveTicker.name,
        sector: effectiveTicker.sector,
        buy_price: parseFloat(buyPrice),
        buy_date: buyDate,
        quantity: parseInt(quantity),
        target_price: targetPrice ? parseFloat(targetPrice) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        notes,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validationBorder =
    validation === "valid" ? "border-gain/50" :
    validation === "invalid" ? "border-loss/50" :
    "border-white/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/5 bg-white/[0.02] p-6"
    >
      <h3 className="mb-4 text-sm font-medium text-white/70">
        {initialValues ? "Edit Holding" : "Add Stock to Portfolio"}
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Symbol search */}
        <div className="relative md:col-span-2">
          <label className="mb-1 block text-xs text-white/40">
            Stock Symbol *
          </label>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
                setSelectedTicker(null);
                setValidatedTicker(null);
                setValidation("idle");
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search by symbol or name..."
              className={`w-full rounded-lg border bg-white/5 px-3 py-2 pr-8 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm ${validationBorder}`}
              required
            />
            {/* Validation status icon */}
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm">
              {validation === "validating" && (
                <svg className="h-4 w-4 animate-spin text-white/40" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {validation === "valid" && <span className="text-gain">✓</span>}
              {validation === "invalid" && <span className="text-loss">✗</span>}
            </span>
          </div>

          {showDropdown && filtered.length > 0 && !selectedTicker && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-charcoal shadow-xl">
              {filtered.map((t) => (
                <button
                  key={t.symbol}
                  type="button"
                  onClick={() => {
                    setSelectedTicker(t);
                    setValidatedTicker({ symbol: t.symbol, name: t.name, sector: t.sector });
                    setSearch(t.symbol);
                    setShowDropdown(false);
                    setValidation("valid");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5"
                >
                  <span className="font-mono text-xs font-medium text-white">
                    {t.symbol}
                  </span>
                  <span className="text-xs text-white/40 line-clamp-1">
                    {t.name}
                  </span>
                  <span className="ml-auto text-[10px] text-accent/50">
                    {t.sector}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Status line below input */}
          {validation === "valid" && effectiveTicker && (
            <p className="mt-1 text-[10px] text-gain/70">
              {effectiveTicker.name}
              {effectiveTicker.sector !== "Unknown" && ` — ${effectiveTicker.sector}`}
            </p>
          )}
          {validation === "invalid" && (
            <p className="mt-1 text-[10px] text-loss/70">
              Symbol not found on EGX — check and try again
            </p>
          )}
          {validation === "error" && (
            <p className="mt-1 text-[10px] text-white/30">
              Could not verify — will attempt to load data anyway
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1 block text-xs text-white/40">Quantity *</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={1}
            placeholder="100"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
            required
          />
        </div>

        {/* Buy Price */}
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Buy Price (EGP) *
          </label>
          <input
            type="number"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="85.50"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
            required
          />
        </div>

        {/* Buy Date */}
        <div>
          <label className="mb-1 block text-xs text-white/40">Buy Date</label>
          <input
            type="date"
            value={buyDate}
            onChange={(e) => setBuyDate(e.target.value)}
            className="w-full min-w-0 appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-[16px] text-white outline-none focus:border-accent/50 md:text-sm"
          />
        </div>

        {/* Target Price */}
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Target Price (optional)
          </label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="110.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
        </div>

        {/* Stop Loss */}
        <div>
          <label className="mb-1 block text-xs text-white/40">
            Stop Loss (optional)
          </label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            min={0.01}
            step={0.01}
            placeholder="75.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs text-white/40">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Why did you buy this stock?"
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[16px] text-white placeholder-white/30 outline-none focus:border-accent/50 md:text-sm"
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={!effectiveTicker || !buyPrice || !quantity || submitting || validation === "validating" || validation === "invalid"}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-charcoal-dark transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {submitting && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {submitting ? (initialValues ? "Saving…" : "Adding…") : (initialValues ? "Update" : "Add to Portfolio")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
