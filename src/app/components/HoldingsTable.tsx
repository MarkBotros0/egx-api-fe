"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { HoldingAnalysis, EntryExit } from "@/app/lib/types";
import LearnTooltip from "./LearnTooltip";
import CompositeGauge from "./CompositeGauge";
import { peColor as peBandColor } from "@/app/lib/constants";
import { groupHoldings, type Position } from "@/app/lib/positions";

/** Same bands as StatsPanel and the backend; falls back to a visible neutral. */
function peColor(pe: number): string {
  return peBandColor(pe) ?? "text-white/60";
}

function zonePill(entryExit: EntryExit | null | undefined) {
  if (!entryExit) return null;
  const { entry_zone, exit_zone } = entryExit;
  if (entry_zone.active) {
    return { label: "Entry", conf: entry_zone.confidence, tone: "gain" as const };
  }
  if (exit_zone.active) {
    return { label: "Exit", conf: exit_zone.confidence, tone: "loss" as const };
  }
  return null;
}

function ZoneBadge({ pill }: { pill: ReturnType<typeof zonePill> }) {
  if (!pill) return null;

  // A `low` zone renders NEUTRAL, not in gain-green or loss-red.
  //
  // `low` is the leftover bucket: nothing disqualified the zone and nothing
  // confirmed it — typically an untested support with unremarkable momentum.
  // The house colour rule is that gain/loss mean a real direction in the data
  // and never decoration, and a zone that has not earned a direction must not
  // borrow one. Same refusal the breadth strip makes inside its neutral band,
  // and it matches the backend, where a low-confidence zone is an `info`
  // signal rather than an `opportunity`.
  const strong = pill.conf === "high" || pill.conf === "medium";
  const tone = !strong
    ? "border-white/12 bg-white/[0.04] text-white/50"
    : pill.tone === "gain"
    ? "border-gain/30 bg-gain/10 text-gain"
    : "border-loss/30 bg-loss/10 text-loss";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}
    >
      {pill.label} zone
      {pill.conf && <span className="text-white/40">· {pill.conf}</span>}
    </span>
  );
}

function ZoneDetail({ entryExit }: { entryExit: EntryExit | null | undefined }) {
  if (!entryExit) return null;
  const { entry_zone, exit_zone } = entryExit;
  if (!entry_zone.active && !exit_zone.active) return null;

  // See ZoneBadge: a low-confidence zone is stated, not celebrated. The band
  // and its border go neutral so the panel does not read as encouragement the
  // reading has not earned.
  const entryStrong =
    entry_zone.confidence === "high" || entry_zone.confidence === "medium";

  return (
    <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
      {entry_zone.active && entry_zone.price_range && (
        <div
          className={`rounded-lg border px-3 py-2 ${
            entryStrong
              ? "border-gain/20 bg-gain/[0.04]"
              : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/50">
              Entry zone ({entry_zone.confidence})
            </span>
            <span
              className={`font-mono text-xs font-semibold ${
                entryStrong ? "text-gain" : "text-white/70"
              }`}
            >
              {entry_zone.price_range.low.toFixed(2)} – {entry_zone.price_range.high.toFixed(2)}
            </span>
          </div>
          {entry_zone.suggested_stop_loss != null && (
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-white/50">Suggested stop-loss</span>
              <span className="font-mono text-white/80">
                {entry_zone.suggested_stop_loss.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
      {exit_zone.active && exit_zone.price_range && (
        <div className="rounded-lg border border-loss/20 bg-loss/[0.04] px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/50">
              Exit zone ({exit_zone.confidence})
            </span>
            <span className="font-mono text-xs font-semibold text-loss">
              {exit_zone.price_range.low.toFixed(2)} – {exit_zone.price_range.high.toFixed(2)}
            </span>
          </div>
        </div>
      )}
      <Link
        href="/learn#entry_exit_zones"
        className="inline-block text-[10px] text-accent/70 hover:text-accent"
      >
        What does this mean? →
      </Link>
    </div>
  );
}

/** Dividends are anchored to the SYMBOL, not to one purchase lot — which is
 *  exactly what a position is, so at this level the figure needs no caveat.
 *  (It used to read "(all lots)" because the row was one lot of several.) */
function DividendPill({ holding }: { holding: HoldingAnalysis }) {
  const amount = holding.dividends_collected ?? 0;
  if (amount <= 0) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-gain/10 px-2 py-0.5 text-[10px] font-medium text-gain">
      +{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} div
      {holding.dividends_symbol_shared ? " (all lots)" : ""}
    </span>
  );
}

/** How many purchases are behind the average price on the card. Only shown
 *  when there is more than one, so a single-lot position reads as it always
 *  has — the pill is what tells you the price above it is an average. */
function LotCountPill({ position }: { position: Position }) {
  if (position.lots.length < 2) return null;
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
      {position.lots.length} lots
    </span>
  );
}

/**
 * The individual purchases behind one position.
 *
 * Each lot keeps its own P&L and annualized return, because those are the
 * figures the position cannot honestly merge: a lot bought in January and one
 * bought in June have different holding periods, and an average of returns
 * over different windows describes neither. Edit and Delete stay per lot for
 * the same reason — a purchase is a fact about one day.
 */
function LotList({
  position,
  onEdit,
  onConfirmDelete,
}: {
  position: Position;
  onEdit: (id: string) => void;
  onConfirmDelete: (target: { id: string; symbol: string }) => void;
}) {
  if (position.lots.length < 2) return null;

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <p className="text-[10px] uppercase tracking-wide text-white/30">
        {position.lots.length} purchases · average{" "}
        <span className="font-mono text-white/50">
          {position.avg_buy_price.toFixed(2)}
        </span>{" "}
        EGP
      </p>
      <div className="mt-2 space-y-2">
        {position.lots.map((lot) => {
          const up = lot.pnl >= 0;
          return (
            <div
              key={lot.id ?? lot.buy_date}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs text-white/80">
                  {lot.quantity} × {lot.buy_price.toFixed(2)}
                </p>
                <p className="text-[10px] text-white/30">
                  {lot.buy_date}
                  {lot.error ? " · no price data" : ` · ${lot.days_held}d`}
                </p>
              </div>
              {!lot.error && (
                <div className="shrink-0 text-right">
                  <p
                    className={`font-mono text-xs ${up ? "text-gain" : "text-loss"}`}
                  >
                    {up ? "+" : ""}
                    {lot.pnl.toFixed(0)}
                    <span className="ml-1 text-[10px]">
                      ({up ? "+" : ""}
                      {lot.pnl_pct.toFixed(1)}%)
                    </span>
                  </p>
                  {lot.annualized_return != null && (
                    <p className="text-[10px] text-white/30">
                      {lot.annualized_return.toFixed(0)}% annualized
                    </p>
                  )}
                </div>
              )}
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => lot.id && onEdit(lot.id)}
                  className="min-h-[44px] px-1 text-xs text-accent/70 hover:text-accent"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    lot.id && onConfirmDelete({ id: lot.id, symbol: lot.symbol })
                  }
                  className="min-h-[44px] px-1 text-xs text-loss/70 hover:text-loss"
                >
                  Del
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface HoldingsTableProps {
  holdings: HoldingAnalysis[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** By SYMBOL, not by lot id: a sell comes out of the whole position and may
   *  span several purchases. The page resolves the lots. */
  onSell: (symbol: string) => void;
  onAddDividend: (holding: HoldingAnalysis) => void;
}

export default function HoldingsTable({
  holdings,
  onEdit,
  onDelete,
  onSell,
  onAddDividend,
}: HoldingsTableProps) {
  // Keyed by SYMBOL now — one card per stock, however many lots it holds.
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; symbol: string } | null>(null);

  const positions = useMemo(() => groupHoldings(holdings), [holdings]);

  if (!holdings.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-white/40">
          No holdings yet. Add your first stock to start tracking your portfolio.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {positions.map((h) => {
          const rowKey = h.symbol;
          const isExpanded = expanded === h.symbol;
          const isPnlPositive = h.pnl >= 0;

          // A position whose price feed is down still has to be sellable —
          // recording a sale never fetches a price. The error stays visible;
          // the action is added beside it, not instead of it.
          if (h.error) {
            return (
              <div key={rowKey} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="font-mono text-xs font-medium text-white">{h.symbol}</span>
                <LotCountPill position={h} />
                <DividendPill holding={h} />
                <p className="mt-1 text-xs text-loss">{h.error}</p>
                <div className="mt-3 flex gap-3 border-t border-white/5 pt-3">
                  <button
                    onClick={() => onSell(h.symbol)}
                    className="min-h-[44px] flex-1 rounded-lg border border-gain/20 py-2 text-sm font-medium text-gain"
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => onAddDividend(h)}
                    className="min-h-[44px] flex-1 rounded-lg border border-gain/20 py-2 text-sm font-medium text-white/40 hover:text-gain"
                  >
                    Dividend
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={rowKey}
              className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              {/* Card header — tappable */}
              <button
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
                onClick={() => setExpanded(isExpanded ? null : h.symbol)}
              >
                {h.composite_score != null && (
                  <CompositeGauge
                    score={h.composite_score}
                    signal={h.composite_signal ?? null}
                    size="sm"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-white">{h.symbol}</span>
                    <LotCountPill position={h} />
                    <DividendPill holding={h} />
                    <span className="text-xs text-white/30 truncate">{h.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-3 text-xs">
                    <span className="text-white/50">
                      {h.quantity} x {h.avg_buy_price.toFixed(2)}
                      {h.lots.length > 1 && <span className="text-white/30"> avg</span>}
                    </span>
                    <span className="text-white/30">=</span>
                    <span className="font-mono text-white">{h.current_value.toFixed(0)} EGP</span>
                  </div>
                  {h.buy_date && (
                    <div className="mt-0.5 text-[10px] text-white/30">
                      {h.lots.length > 1
                        ? `First bought ${h.buy_date}`
                        : `Lot from ${h.buy_date}`}
                    </div>
                  )}
                  {zonePill(h.entry_exit) && (
                    <div className="mt-1.5">
                      <ZoneBadge pill={zonePill(h.entry_exit)} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-mono text-sm font-medium ${isPnlPositive ? "text-gain" : "text-loss"}`}>
                    {isPnlPositive ? "+" : ""}{h.pnl.toFixed(0)}
                  </p>
                  <p className={`font-mono text-xs ${isPnlPositive ? "text-gain/70" : "text-loss/70"}`}>
                    {isPnlPositive ? "+" : ""}{h.pnl_pct.toFixed(1)}%
                  </p>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {h.composite_score != null && (
                      <div>
                        <p className="text-white/40">Score</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <CompositeGauge score={h.composite_score} signal={h.composite_signal ?? null} size="sm" />
                          <span className="font-mono text-white/70">{h.composite_signal}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-white/40">Current Price</p>
                      <p className="font-mono text-white">{h.current_price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-white/40">Days Held</p>
                      <p className="font-mono text-white/70">{h.days_held}</p>
                    </div>
                    <div>
                      <p className="text-white/40">RSI</p>
                      <p className={`font-mono ${
                        h.rsi != null
                          ? h.rsi > 70 ? "text-loss" : h.rsi < 30 ? "text-gain" : "text-white/60"
                          : "text-white/30"
                      }`}>
                        {h.rsi != null ? h.rsi.toFixed(0) : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">vs SMA 50</p>
                      <p className={h.above_sma != null
                        ? h.above_sma ? "font-mono text-gain" : "font-mono text-loss"
                        : "font-mono text-white/30"
                      }>
                        {h.above_sma != null ? (h.above_sma ? "Above" : "Below") : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">Volatility</p>
                      <p className="font-mono text-white/70">
                        {h.volatility != null ? `${(h.volatility * 100).toFixed(2)}%` : "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">Volume Trend</p>
                      <p className="font-mono text-white/70 capitalize">{h.volume_trend}</p>
                    </div>
                    {h.pe?.pe_ratio != null && (
                      <div>
                        <p className="text-white/40">P/E</p>
                        <p className={`font-mono ${peColor(h.pe.pe_ratio)}`}>
                          {h.pe.pe_ratio.toFixed(1)}
                        </p>
                      </div>
                    )}
                    {h.target_price != null && (
                      <div>
                        <p className="text-white/40">To Target</p>
                        <p className="font-mono text-accent">
                          {h.dist_to_target != null ? `${h.dist_to_target.toFixed(1)}%` : "--"} ({h.target_price.toFixed(2)})
                        </p>
                      </div>
                    )}
                    {h.stop_loss != null && (
                      <div>
                        <p className="text-white/40">To Stop Loss</p>
                        <p className="font-mono text-loss">
                          {h.dist_to_stop != null ? `${h.dist_to_stop.toFixed(1)}%` : "--"} ({h.stop_loss.toFixed(2)})
                        </p>
                      </div>
                    )}
                    {h.key_levels?.nearest_support && (
                      <div>
                        <p className="text-white/40">Nearest Support</p>
                        <p className="font-mono text-gain">
                          {h.key_levels.nearest_support.price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {h.key_levels?.nearest_resistance && (
                      <div>
                        <p className="text-white/40">Nearest Resistance</p>
                        <p className="font-mono text-loss">
                          {h.key_levels.nearest_resistance.price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {(h.dividends_collected ?? 0) > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-white/30">
                          Dividends {h.dividends_symbol_shared ? `(all ${h.symbol} lots)` : "collected"}
                        </p>
                        <p className="mt-0.5 font-mono text-sm text-gain">
                          +{(h.dividends_collected ?? 0).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}{" "}
                          EGP
                        </p>
                      </div>
                    )}
                  </div>

                  {/* The purchases behind the average — multi-lot only */}
                  <LotList
                    position={h}
                    onEdit={onEdit}
                    onConfirmDelete={setConfirmDelete}
                  />

                  {/* Entry/exit zone detail — mobile */}
                  <ZoneDetail entryExit={h.entry_exit} />

                  {/* Actions. Sell and Dividend belong to the POSITION; Edit
                      and Delete belong to a purchase, so on a multi-lot
                      position they live on each lot above instead. */}
                  <div className="mt-3 flex gap-3 border-t border-white/5 pt-3">
                    {h.lots.length === 1 && (
                      <button
                        onClick={() => h.id && onEdit(h.id)}
                        className="min-h-[44px] flex-1 rounded-lg border border-accent/20 py-2 text-sm font-medium text-accent"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => onSell(h.symbol)}
                      className="min-h-[44px] flex-1 rounded-lg border border-gain/20 py-2 text-sm font-medium text-gain"
                    >
                      Sell
                    </button>
                    <button
                      onClick={() => onAddDividend(h)}
                      className="min-h-[44px] flex-1 rounded-lg border border-white/10 py-2 text-sm font-medium text-white/40 hover:text-gain"
                    >
                      Dividend
                    </button>
                    {h.lots.length === 1 && (
                      <button
                        onClick={() => {
                          if (h.id) setConfirmDelete({ id: h.id, symbol: h.symbol });
                        }}
                        className="min-h-[44px] flex-1 rounded-lg border border-loss/20 py-2 text-sm font-medium text-loss"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[11px] text-white/40">
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">
                  <LearnTooltip
                    term="Score"
                    explanation="Composite 0-100 score blending 8 categories: trend, momentum, volume, volatility, divergence, quality, risk-adjusted return and relative strength. It describes present condition, not what to do: 80+ means most categories read positively, under 20 means most read poorly. Backtesting found it does not predict which stock outperforms."
                  >
                    <span>Score</span>
                  </LearnTooltip>
                </th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Buy Price</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">P&L (EGP)</th>
                <th className="px-4 py-3 font-medium">P&L (%)</th>
                <th className="px-4 py-3 font-medium">Days</th>
                <th className="px-4 py-3 font-medium">
                  <LearnTooltip term="RSI" explanation="Relative Strength Index (0-100). >70=overbought, <30=oversold.">
                    <span>RSI</span>
                  </LearnTooltip>
                </th>
                <th className="px-4 py-3 font-medium">
                  <LearnTooltip term="P/E" explanation="Price-to-Earnings ratio, judged against the EGX median of about 12. Green under 8 (genuinely cheap here), red at 25 or above (expensive). Under 3 shows neutral, not green — that is usually one-off earnings or a collapsed price, not a bargain. Dash = no stored data.">
                    <span>P/E</span>
                  </LearnTooltip>
                </th>
                <th className="px-4 py-3 font-medium">
                  <LearnTooltip term="vs SMA" explanation="Whether the stock is trading above or below its 50-day Simple Moving Average. Above = bullish trend, Below = bearish.">
                    <span>vs SMA</span>
                  </LearnTooltip>
                </th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((h) => {
                const rowKey = h.symbol;
                const isExpanded = expanded === h.symbol;
                const isPnlPositive = h.pnl >= 0;

                // Sellable despite the error — see the mobile branch above.
                // colSpan is 10, not 11, so the Actions column stays its own
                // cell and the row still totals the table's 12 columns.
                if (h.error) {
                  return (
                    <tr key={rowKey} className="border-b border-white/5">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-white">
                        {h.symbol}
                        <LotCountPill position={h} />
                        <DividendPill holding={h} />
                      </td>
                      <td colSpan={10} className="px-4 py-3 text-xs text-loss">
                        {h.error}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSell(h.symbol)}
                            className="text-xs text-gain/70 hover:text-gain"
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => onAddDividend(h)}
                            className="min-h-[44px] text-xs text-white/40 hover:text-gain"
                          >
                            Dividend
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      onClick={() => setExpanded(isExpanded ? null : h.symbol)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-white">
                          {h.symbol}
                        </span>
                        <LotCountPill position={h} />
                        <DividendPill holding={h} />
                        <p className="text-[10px] text-white/30">
                          {h.name}
                          {h.buy_date
                            ? ` · ${h.lots.length > 1 ? "from " : ""}${h.buy_date}`
                            : ""}
                        </p>
                        {zonePill(h.entry_exit) && (
                          <div className="mt-1">
                            <ZoneBadge pill={zonePill(h.entry_exit)} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {h.composite_score != null ? (
                          <div className="flex items-center gap-2">
                            <CompositeGauge
                              score={h.composite_score}
                              signal={h.composite_signal ?? null}
                              size="sm"
                            />
                            <span className="text-[10px] text-white/50">
                              {h.composite_signal}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/70">
                        {h.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/70">
                        {h.avg_buy_price.toFixed(2)}
                        {h.lots.length > 1 && (
                          <span className="ml-1 font-sans text-[10px] text-white/30">
                            avg
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-white">
                        {h.current_price.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs font-medium ${isPnlPositive ? "text-gain" : "text-loss"}`}>
                        {isPnlPositive ? "+" : ""}{h.pnl.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 font-mono text-xs font-medium ${isPnlPositive ? "text-gain" : "text-loss"}`}>
                        {isPnlPositive ? "+" : ""}{h.pnl_pct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white/50">
                        {h.days_held}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <span
                          className={
                            h.rsi != null
                              ? h.rsi > 70
                                ? "text-loss"
                                : h.rsi < 30
                                  ? "text-gain"
                                  : "text-white/60"
                              : "text-white/30"
                          }
                        >
                          {h.rsi != null ? h.rsi.toFixed(0) : "--"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {h.pe?.pe_ratio != null ? (
                          <span className={peColor(h.pe.pe_ratio)}>
                            {h.pe.pe_ratio.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-white/30">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {h.above_sma != null ? (
                          <span className={h.above_sma ? "text-gain" : "text-loss"}>
                            {h.above_sma ? "Above" : "Below"}
                          </span>
                        ) : (
                          <span className="text-white/30">--</span>
                        )}
                      </td>
                      {/* Sell and Dividend act on the POSITION. Edit and Del
                          act on a purchase, so once there are several they
                          move into the lot list in the expanded row. */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          {h.lots.length === 1 && (
                            <button
                              onClick={() => h.id && onEdit(h.id)}
                              className="text-xs text-accent/70 hover:text-accent"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => onSell(h.symbol)}
                            className="text-xs text-gain/70 hover:text-gain"
                          >
                            Sell
                          </button>
                          <button
                            onClick={() => onAddDividend(h)}
                            className="min-h-[44px] text-xs text-white/40 hover:text-gain"
                          >
                            Dividend
                          </button>
                          {h.lots.length === 1 && (
                            <button
                              onClick={() => {
                                if (h.id) setConfirmDelete({ id: h.id, symbol: h.symbol });
                              }}
                              className="text-xs text-loss/70 hover:text-loss"
                            >
                              Del
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                            <div>
                              <p className="text-white/40">Invested</p>
                              <p className="font-mono text-white">{h.invested.toFixed(2)} EGP</p>
                            </div>
                            <div>
                              <p className="text-white/40">Current Value</p>
                              <p className="font-mono text-white">{h.current_value.toFixed(2)} EGP</p>
                            </div>
                            {/* The backend returns null under ~30 days held,
                                where annualizing is meaningless (a +5% week
                                extrapolates to five figures). */}
                            <div>
                              <p className="text-white/40" title="Your position's gain since you bought it, projected to a full year. This measures your purchase, not the stock's own 12-month performance — the Risk-Adjusted category in the score uses the latter.">
                                Annualized Return
                              </p>
                              {h.annualized_return != null ? (
                                <p className={`font-mono ${h.annualized_return >= 0 ? "text-gain" : "text-loss"}`}>
                                  {h.annualized_return.toFixed(1)}%
                                </p>
                              ) : h.lots.length > 1 ? (
                                /* Not aggregated on purpose: the lots have
                                   different holding periods, and averaging
                                   returns over different windows describes
                                   neither. It is stated per lot below. */
                                <p className="font-mono text-xs text-white/40" title="Each purchase has its own holding period, so there is no single honest figure for the position. Shown per lot below.">
                                  per lot
                                </p>
                              ) : (
                                <p className="font-mono text-white/30" title="Needs at least 30 days held before annualizing means anything.">
                                  --
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-white/40" title="A typical one-day move (20-day standard deviation of daily returns). The score breakdown quotes an annualized figure, roughly 16x this.">
                                Volatility (20d daily)
                              </p>
                              <p className="font-mono text-white/70">
                                {h.volatility != null ? `${(h.volatility * 100).toFixed(2)}%` : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-white/40">Volume Trend</p>
                              <p className="font-mono text-white/70 capitalize">{h.volume_trend}</p>
                            </div>
                            {h.target_price != null && (
                              <div>
                                <p className="text-white/40">To Target</p>
                                <p className="font-mono text-accent">
                                  {h.dist_to_target != null ? `${h.dist_to_target.toFixed(1)}%` : "--"} ({h.target_price.toFixed(2)})
                                </p>
                              </div>
                            )}
                            {h.stop_loss != null && (
                              <div>
                                <p className="text-white/40">To Stop Loss</p>
                                <p className="font-mono text-loss">
                                  {h.dist_to_stop != null ? `${h.dist_to_stop.toFixed(1)}%` : "--"} ({h.stop_loss.toFixed(2)})
                                </p>
                              </div>
                            )}
                            {/* distance_pct is SIGNED (negative = level is
                                below price). Printing it raw showed
                                "38.40 (-5.2%)" in green, which reads as a
                                loss. Show the magnitude plus a direction
                                word, matching KeyLevelsCard, and flag the
                                level as broken when price has crossed it. */}
                            {h.key_levels?.nearest_support && (
                              <div>
                                <p className="text-white/40">Nearest Support</p>
                                <p
                                  className={`font-mono ${
                                    h.key_levels.nearest_support.distance_pct > 0
                                      ? "text-loss"
                                      : "text-gain"
                                  }`}
                                >
                                  {h.key_levels.nearest_support.price.toFixed(2)}
                                  <span className="ml-1 text-[10px] text-white/40">
                                    {h.key_levels.nearest_support.distance_pct > 0
                                      ? `(broken — ${h.key_levels.nearest_support.distance_pct.toFixed(1)}% above)`
                                      : `(${Math.abs(h.key_levels.nearest_support.distance_pct).toFixed(1)}% below)`}
                                  </span>
                                </p>
                              </div>
                            )}
                            {h.key_levels?.nearest_resistance && (
                              <div>
                                <p className="text-white/40">Nearest Resistance</p>
                                <p
                                  className={`font-mono ${
                                    h.key_levels.nearest_resistance.distance_pct < 0
                                      ? "text-gain"
                                      : "text-loss"
                                  }`}
                                >
                                  {h.key_levels.nearest_resistance.price.toFixed(2)}
                                  <span className="ml-1 text-[10px] text-white/40">
                                    {h.key_levels.nearest_resistance.distance_pct < 0
                                      ? `(cleared — ${Math.abs(h.key_levels.nearest_resistance.distance_pct).toFixed(1)}% below)`
                                      : `(${h.key_levels.nearest_resistance.distance_pct.toFixed(1)}% above)`}
                                  </span>
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-white/40">
                                {h.lots.length > 1 ? "First Bought" : "Buy Date"}
                              </p>
                              <p className="font-mono text-white/70">{h.buy_date}</p>
                            </div>
                            {(h.dividends_collected ?? 0) > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-white/30">
                                  Dividends {h.dividends_symbol_shared ? `(all ${h.symbol} lots)` : "collected"}
                                </p>
                                <p className="mt-0.5 font-mono text-sm text-gain">
                                  +{(h.dividends_collected ?? 0).toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  EGP
                                </p>
                              </div>
                            )}
                          </div>

                          {/* The purchases behind the average — multi-lot only */}
                          <LotList
                            position={h}
                            onEdit={onEdit}
                            onConfirmDelete={setConfirmDelete}
                          />

                          {/* Entry/exit zone detail — desktop */}
                          <ZoneDetail entryExit={h.entry_exit} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-sm rounded-2xl bg-charcoal p-6">
            <p className="text-base font-semibold text-white">Remove holding?</p>
            <p className="mt-2 text-sm text-white/50">
              <span className="font-mono text-white/80">{confirmDelete.symbol}</span> will be removed
              from your portfolio. This cannot be undone.
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
                className="min-h-[44px] flex-1 rounded-xl bg-loss text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
