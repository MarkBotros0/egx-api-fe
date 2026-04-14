"use client";

import { useMemo, useState } from "react";
import type { ScoreWeights } from "../lib/types";
import {
  useScoreWeights,
  normalizeWeights,
} from "./ScoreWeightsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORY_META: Record<
  keyof ScoreWeights,
  { label: string; description: string }
> = {
  trend: {
    label: "Trend",
    description:
      "Moving averages, golden/death crosses, and ADX trend strength.",
  },
  momentum: {
    label: "Momentum",
    description: "RSI, MACD histogram direction, and Stochastic.",
  },
  volume: {
    label: "Volume",
    description:
      "OBV vs price, Money Flow Index (MFI), and volume-price confirmation.",
  },
  volatility: {
    label: "Volatility",
    description: "Bollinger Band position and squeeze detection.",
  },
  divergence: {
    label: "Divergence",
    description: "RSI and MACD divergences — reversal signals.",
  },
};

const CATS: (keyof ScoreWeights)[] = [
  "trend",
  "momentum",
  "volume",
  "volatility",
  "divergence",
];

export default function ScoreWeightsModal({ open, onClose, onSaved }: Props) {
  const {
    draft,
    presets,
    saving,
    updateDraftField,
    applyPreset,
    resetDraft,
    save,
  } = useScoreWeights();

  const [localError, setLocalError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeWeights(draft), [draft]);
  const rawTotal = useMemo(
    () =>
      CATS.reduce((s, k) => s + (draft[k] || 0), 0),
    [draft]
  );

  if (!open) return null;

  const handleSave = async () => {
    setLocalError(null);
    try {
      await save();
      onSaved?.();
      onClose();
    } catch (e: any) {
      setLocalError(e?.message || "Failed to save");
    }
  };

  const handleCancel = () => {
    resetDraft();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-weights-title"
    >
      <div className="w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl bg-charcoal border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-charcoal border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2
              id="score-weights-title"
              className="font-mono text-base font-semibold text-white"
            >
              Composite Score Weights
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              Tune how each category contributes to the 0-100 score.
            </p>
          </div>
          <button
            onClick={handleCancel}
            aria-label="Close"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* Presets */}
        <div className="px-5 pt-4">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">
            Presets
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(presets).map((name) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className="rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 capitalize"
              >
                {name.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="px-5 pt-5 pb-3 space-y-5">
          {CATS.map((cat) => {
            const raw = draft[cat] ?? 0;
            const norm = normalized[cat] ?? 0;
            return (
              <div key={cat}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div>
                    <div className="font-mono text-sm font-medium text-white capitalize">
                      {CATEGORY_META[cat].label}
                    </div>
                    <div className="text-[11px] text-white/40 leading-snug max-w-[260px]">
                      {CATEGORY_META[cat].description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-accent">
                      {norm.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-white/40">
                      raw {raw.toFixed(0)}
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={raw}
                  onChange={(e) =>
                    updateDraftField(cat, Number(e.target.value))
                  }
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-accent"
                  aria-label={`${CATEGORY_META[cat].label} weight`}
                />
              </div>
            );
          })}
        </div>

        {/* Totals / note */}
        <div className="px-5 pb-2 text-[11px] text-white/40 leading-relaxed">
          Raw total: <span className="font-mono text-white/60">{rawTotal.toFixed(0)}</span>.
          Values are auto-normalized to sum to 100 on save — you don't need to
          do the math yourself.
        </div>

        {localError && (
          <div className="px-5 pb-2 text-xs text-loss">{localError}</div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-charcoal border-t border-white/10 px-5 py-3 flex gap-2">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white/80 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || rawTotal === 0}
            className="flex-1 rounded-lg bg-accent hover:bg-accent/90 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
