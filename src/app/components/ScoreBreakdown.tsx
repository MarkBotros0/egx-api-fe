"use client";

import { useState } from "react";
import type { CompositeScore } from "../lib/types";
import { scoreColor } from "./CompositeGauge";
import ScoreWeightsModal from "./ScoreWeightsModal";

interface Props {
  composite: CompositeScore;
  onWeightsChanged?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  trend: "Trend",
  momentum: "Momentum",
  volume: "Volume",
  volatility: "Volatility",
  divergence: "Divergence",
};

const CATEGORY_ORDER = ["trend", "momentum", "volume", "volatility", "divergence"];

export default function ScoreBreakdown({ composite, onWeightsChanged }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-mono text-sm font-semibold text-white">
            Score Breakdown
          </div>
          <div className="text-[11px] text-white/40">
            5 categories blended with your weights
          </div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/80 flex items-center gap-1"
          aria-label="Adjust weights"
        >
          <span aria-hidden>⚙</span>
          <span className="hidden sm:inline">Adjust weights</span>
        </button>
      </div>

      <div className="space-y-2">
        {CATEGORY_ORDER.map((name) => {
          const cat = composite.categories[name as keyof CompositeScore["categories"]];
          if (!cat) return null;

          const score = cat.score;
          const isOpen = expanded === name;
          const color = score !== null ? scoreColor(score) : "#4a4a5a";
          const barPct = score !== null ? Math.max(0, Math.min(100, score)) : 0;

          return (
            <button
              key={name}
              onClick={() => setExpanded(isOpen ? null : name)}
              className="block w-full text-left rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-3 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-white/90">
                    {CATEGORY_LABELS[name]}
                  </span>
                  <span className="text-white/40">
                    {cat.weight.toFixed(0)}% weight
                  </span>
                </div>
                <span
                  className="font-mono font-semibold"
                  style={{ color }}
                >
                  {score !== null ? score.toFixed(0) : "—"}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barPct}%`,
                    background: color,
                  }}
                />
              </div>
              {isOpen && cat.reasons.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {cat.reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-white/60 leading-relaxed flex gap-2"
                    >
                      <span className="text-white/30 mt-0.5" aria-hidden>•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
              {isOpen && cat.reasons.length === 0 && (
                <div className="mt-2 text-[11px] text-white/40 italic">
                  No notable signals in this category.
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-white/30">
        Composite score is an educational tool combining technical indicators.
        It does not predict the future. Always consider fundamentals, news, and
        macro conditions before trading.
      </p>

      <ScoreWeightsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => {
          onWeightsChanged?.();
        }}
      />
    </div>
  );
}
