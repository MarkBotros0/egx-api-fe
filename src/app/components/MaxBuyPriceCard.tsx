"use client";

import { useState } from "react";
import Link from "next/link";

import LearnTooltip from "./LearnTooltip";
import type { MaxBuyPrice } from "@/app/lib/types";

interface MaxBuyPriceCardProps {
  maxBuyPrice: MaxBuyPrice | null | undefined;
  currentPrice: number;
}

export default function MaxBuyPriceCard({
  maxBuyPrice,
  currentPrice,
}: MaxBuyPriceCardProps) {
  const [open, setOpen] = useState(false);
  if (!maxBuyPrice) return null;

  const { price, verdict, verdict_distance_pct, stop_loss, target, risk_reward_at_max, reasons } =
    maxBuyPrice;

  const verdictCopy = {
    ok: {
      label: "OK to buy at current price",
      sub: `Current ${currentPrice.toFixed(2)} EGP is ${Math.abs(verdict_distance_pct).toFixed(1)}% below your max.`,
      tone: "gain" as const,
    },
    near_limit: {
      label: "Near the max — enter carefully",
      sub: `Current ${currentPrice.toFixed(2)} EGP is within 2% of your max. Don't chase.`,
      tone: "amber" as const,
    },
    above_limit: {
      label: "Above your max — wait for a pullback",
      sub: `Current ${currentPrice.toFixed(2)} EGP is ${verdict_distance_pct.toFixed(1)}% above max. Buying here makes the trade's risk:reward too thin.`,
      tone: "loss" as const,
    },
  }[verdict];

  const toneClasses = {
    gain: "border-gain/30 bg-gain/[0.06] text-gain",
    amber: "border-amber-400/30 bg-amber-400/[0.06] text-amber-300",
    loss: "border-loss/30 bg-loss/[0.06] text-loss",
  }[verdictCopy.tone];

  const bigNumberColor = {
    gain: "text-gain",
    amber: "text-amber-300",
    loss: "text-loss",
  }[verdictCopy.tone];

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            <LearnTooltip
              term="Max Buy Price"
              explanation="The maximum price at which entering this stock still respects the two beginner-safe risk rules: (1) don't pay more than 5% above nearest support, and (2) potential reward must be at least 2× the risk. Pay more than this and you're chasing."
            >
              <span>Max Buy Price</span>
            </LearnTooltip>
          </h3>
          <p className="mt-0.5 text-[11px] text-white/40">
            Support + risk:reward guardrails.
          </p>
        </div>
        <Link
          href="/learn#max_buy_price"
          className="shrink-0 text-[10px] text-accent/70 hover:text-accent"
        >
          Learn →
        </Link>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-[11px] text-white/40">≤</span>
        <span className={`font-mono text-3xl font-bold ${bigNumberColor}`}>
          {price.toFixed(2)}
        </span>
        <span className="text-xs text-white/40">EGP / share</span>
      </div>

      <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${toneClasses}`}>
        <p className="font-medium">{verdictCopy.label}</p>
        <p className="mt-0.5 text-[11px] opacity-80">{verdictCopy.sub}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-white/[0.03] px-2 py-2">
          <p className="text-[10px] text-white/40">Stop-loss</p>
          <p className="mt-0.5 font-mono text-xs font-bold text-loss">
            {stop_loss.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-2 py-2">
          <p className="text-[10px] text-white/40">Target</p>
          <p className="mt-0.5 font-mono text-xs font-bold text-gain">
            {target != null ? target.toFixed(2) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.03] px-2 py-2">
          <p className="text-[10px] text-white/40">R:R at max</p>
          <p className="mt-0.5 font-mono text-xs font-bold text-white/80">
            {risk_reward_at_max != null ? `${risk_reward_at_max.toFixed(2)} : 1` : "—"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[11px] text-white/60 hover:text-white"
      >
        <span>Why this limit?</span>
        <span className="text-white/40">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 rounded-lg bg-white/[0.02] px-3 py-3 text-[11px] leading-relaxed text-white/60">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-white/30">·</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-white/30">
        This limit is risk-first, not a price target. A stock can be a great
        long-term hold and still be a poor buy today. Patience beats chasing.
      </p>
    </div>
  );
}
