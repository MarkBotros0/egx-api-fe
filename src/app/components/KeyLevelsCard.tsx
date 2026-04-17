"use client";

import LearnTooltip from "./LearnTooltip";
import type { KeyLevels } from "@/app/lib/types";

interface KeyLevelsCardProps {
  keyLevels: KeyLevels | null | undefined;
}

export default function KeyLevelsCard({ keyLevels }: KeyLevelsCardProps) {
  if (!keyLevels) return null;

  const { current_price, nearest_support, nearest_resistance } = keyLevels;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">
          <LearnTooltip
            term="Key Levels"
            explanation="Support and resistance are price zones where the stock has repeatedly bounced (support) or stalled (resistance). These levels give you a reference for where to buy (near support) and where to trim (near resistance)."
          >
            <span>Key Levels</span>
          </LearnTooltip>
        </h3>
        <span className="font-mono text-[10px] text-white/30">
          {current_price.toFixed(2)} EGP
        </span>
      </div>

      <div className="space-y-3">
        <LevelRow
          kind="resistance"
          level={nearest_resistance}
          currentPrice={current_price}
        />

        <div className="relative py-1">
          <div className="border-t border-dashed border-white/10" />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-charcoal-dark px-2 font-mono text-[10px] text-white/50">
            {current_price.toFixed(2)}
          </div>
        </div>

        <LevelRow
          kind="support"
          level={nearest_support}
          currentPrice={current_price}
        />
      </div>
    </div>
  );
}

function LevelRow({
  kind,
  level,
  currentPrice,
}: {
  kind: "support" | "resistance";
  level: KeyLevels["nearest_support"];
  currentPrice: number;
}) {
  const isSupport = kind === "support";
  const label = isSupport ? "Nearest Support" : "Nearest Resistance";
  const accent = isSupport ? "text-gain" : "text-loss";

  if (!level) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <span className="text-[11px] uppercase tracking-wider text-white/40">
          {label}
        </span>
        <span className="text-xs text-white/30">—</span>
      </div>
    );
  }

  const dist = level.distance_pct;
  const absDist = Math.abs(dist);
  const brokenThrough =
    (isSupport && level.price > currentPrice) ||
    (!isSupport && level.price < currentPrice);
  const directionText = isSupport
    ? brokenThrough
      ? `${absDist.toFixed(1)}% above current — broken`
      : `${absDist.toFixed(1)}% below current`
    : brokenThrough
      ? `${absDist.toFixed(1)}% below current — broken`
      : `${absDist.toFixed(1)}% above current`;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
        brokenThrough
          ? "border-yellow-400/20 bg-yellow-400/[0.04]"
          : "border-white/5 bg-white/[0.02]"
      }`}
    >
      <div>
        <div className="text-[11px] uppercase tracking-wider text-white/40">
          {label}
        </div>
        <div className={`font-mono text-sm font-semibold ${accent}`}>
          {level.price.toFixed(2)} EGP
        </div>
        <div className="mt-0.5 text-[10px] text-white/40">
          Tested {level.strength}x
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-xs text-white/60">{directionText}</div>
      </div>
    </div>
  );
}
