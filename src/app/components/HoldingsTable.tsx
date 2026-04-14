"use client";

import React, { useState } from "react";
import type { HoldingAnalysis } from "@/app/lib/types";
import LearnTooltip from "./LearnTooltip";
import CompositeGauge from "./CompositeGauge";

interface HoldingsTableProps {
  holdings: HoldingAnalysis[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function HoldingsTable({
  holdings,
  onEdit,
  onDelete,
}: HoldingsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; symbol: string } | null>(null);

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
        {holdings.map((h) => {
          const rowKey = h.id ?? h.symbol;
          const isExpanded = expanded === h.id;
          const isPnlPositive = h.pnl >= 0;
          const isMenuOpen = menuOpen === h.id;

          if (h.error) {
            return (
              <div key={rowKey} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <span className="font-mono text-xs font-medium text-white">{h.symbol}</span>
                <p className="mt-1 text-xs text-loss">{h.error}</p>
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
                onClick={() => setExpanded(isExpanded ? null : h.id ?? null)}
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
                    <span className="text-xs text-white/30 truncate">{h.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-3 text-xs">
                    <span className="text-white/50">{h.quantity} x {h.buy_price.toFixed(2)}</span>
                    <span className="text-white/30">=</span>
                    <span className="font-mono text-white">{h.current_value.toFixed(0)} EGP</span>
                  </div>
                  {h.buy_date && (
                    <div className="mt-0.5 text-[10px] text-white/30">
                      Lot from {h.buy_date}
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
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-3 border-t border-white/5 pt-3">
                    <button
                      onClick={() => h.id && onEdit(h.id)}
                      className="min-h-[44px] flex-1 rounded-lg border border-accent/20 py-2 text-sm font-medium text-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (h.id) setConfirmDelete({ id: h.id, symbol: h.symbol });
                      }}
                      className="min-h-[44px] flex-1 rounded-lg border border-loss/20 py-2 text-sm font-medium text-loss"
                    >
                      Delete
                    </button>
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
                    explanation="Composite 0-100 score blending trend, momentum, volume, volatility, and divergence signals. 80+ = Strong Buy, 0-20 = Strong Sell."
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
                  <LearnTooltip term="vs SMA" explanation="Whether the stock is trading above or below its 50-day Simple Moving Average. Above = bullish trend, Below = bearish.">
                    <span>vs SMA</span>
                  </LearnTooltip>
                </th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((h) => {
                const rowKey = h.id ?? h.symbol;
                const isExpanded = expanded === h.id;
                const isPnlPositive = h.pnl >= 0;

                if (h.error) {
                  return (
                    <tr key={rowKey} className="border-b border-white/5">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-white">
                        {h.symbol}
                      </td>
                      <td colSpan={10} className="px-4 py-3 text-xs text-loss">
                        {h.error}
                      </td>
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                      onClick={() => setExpanded(isExpanded ? null : h.id ?? null)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-white">
                          {h.symbol}
                        </span>
                        <p className="text-[10px] text-white/30">
                          {h.name}
                          {h.buy_date ? ` · ${h.buy_date}` : ""}
                        </p>
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
                        {h.buy_price.toFixed(2)}
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
                      <td className="px-4 py-3 text-xs">
                        {h.above_sma != null ? (
                          <span className={h.above_sma ? "text-gain" : "text-loss"}>
                            {h.above_sma ? "Above" : "Below"}
                          </span>
                        ) : (
                          <span className="text-white/30">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => h.id && onEdit(h.id)}
                            className="text-xs text-accent/70 hover:text-accent"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (h.id) setConfirmDelete({ id: h.id, symbol: h.symbol });
                            }}
                            className="text-xs text-loss/70 hover:text-loss"
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <td colSpan={11} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
                            <div>
                              <p className="text-white/40">Invested</p>
                              <p className="font-mono text-white">{h.invested.toFixed(2)} EGP</p>
                            </div>
                            <div>
                              <p className="text-white/40">Current Value</p>
                              <p className="font-mono text-white">{h.current_value.toFixed(2)} EGP</p>
                            </div>
                            <div>
                              <p className="text-white/40">Annualized Return</p>
                              <p className={`font-mono ${h.annualized_return >= 0 ? "text-gain" : "text-loss"}`}>
                                {h.annualized_return.toFixed(1)}%
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
                            <div>
                              <p className="text-white/40">Buy Date</p>
                              <p className="font-mono text-white/70">{h.buy_date}</p>
                            </div>
                          </div>
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
