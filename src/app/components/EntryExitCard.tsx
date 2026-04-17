"use client";

import Link from "next/link";
import LearnTooltip from "./LearnTooltip";
import type { EntryExit, ZoneConfidence } from "@/app/lib/types";

interface EntryExitCardProps {
  entryExit: EntryExit | null | undefined;
}

const CONFIDENCE_STYLES: Record<ZoneConfidence, { label: string; badge: string }> = {
  high: { label: "High", badge: "bg-gain/20 text-gain border-gain/30" },
  medium: { label: "Medium", badge: "bg-accent/20 text-accent border-accent/30" },
  low: { label: "Low", badge: "bg-white/10 text-white/60 border-white/10" },
};

export default function EntryExitCard({ entryExit }: EntryExitCardProps) {
  if (!entryExit) return null;

  const { entry_zone, exit_zone } = entryExit;
  const anyActive = entry_zone.active || exit_zone.active;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">
          <LearnTooltip
            term="Entry / Exit Zones"
            explanation="Entry zones combine a tested support level with non-overbought momentum — a beginner-friendly way to time a buy. Exit zones combine resistance with overbought momentum — a cue to trim or tighten your stop-loss."
          >
            <span>Entry / Exit Zones</span>
          </LearnTooltip>
        </h3>
        <Link
          href="/learn#entry_exit_zones"
          className="text-[10px] text-accent/70 hover:text-accent"
        >
          Learn more →
        </Link>
      </div>

      {!anyActive ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center">
          <p className="text-xs text-white/50">
            No active entry or exit zone right now — price is sitting between
            support and resistance without momentum confirmation either way.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entry_zone.active && (
            <ZoneBlock
              kind="entry"
              confidence={entry_zone.confidence}
              priceRange={entry_zone.price_range}
              suggestedStopLoss={entry_zone.suggested_stop_loss}
              reasons={entry_zone.reasons}
            />
          )}
          {exit_zone.active && (
            <ZoneBlock
              kind="exit"
              confidence={exit_zone.confidence}
              priceRange={exit_zone.price_range}
              suggestedStopLoss={null}
              reasons={exit_zone.reasons}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ZoneBlock({
  kind,
  confidence,
  priceRange,
  suggestedStopLoss,
  reasons,
}: {
  kind: "entry" | "exit";
  confidence: ZoneConfidence | null;
  priceRange: { low: number; high: number } | null;
  suggestedStopLoss: number | null;
  reasons: string[];
}) {
  const isEntry = kind === "entry";
  const title = isEntry ? "Entry Zone" : "Exit Zone";
  const icon = isEntry ? "$" : "!";
  const baseColor = isEntry ? "text-gain" : "text-loss";
  const bgTint = isEntry
    ? "border-gain/20 bg-gain/[0.04]"
    : "border-loss/20 bg-loss/[0.04]";
  const confStyle = confidence ? CONFIDENCE_STYLES[confidence] : null;

  return (
    <div className={`rounded-lg border ${bgTint} px-3 py-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`font-mono text-lg font-bold ${baseColor}`}>
            {icon}
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/50">
              {title}
            </div>
            {priceRange && (
              <div className={`font-mono text-sm font-semibold ${baseColor}`}>
                {priceRange.low.toFixed(2)} – {priceRange.high.toFixed(2)} EGP
              </div>
            )}
          </div>
        </div>
        {confStyle && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${confStyle.badge}`}
          >
            {confStyle.label} confidence
          </span>
        )}
      </div>

      {suggestedStopLoss != null && (
        <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
          <span className="text-[11px] text-white/50">Suggested stop-loss</span>
          <span className="font-mono text-xs font-medium text-white/80">
            {suggestedStopLoss.toFixed(2)} EGP
          </span>
        </div>
      )}

      {reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {reasons.map((r, i) => (
            <li
              key={i}
              className="text-[11px] leading-relaxed text-white/60 before:mr-1.5 before:text-white/30 before:content-['•']"
            >
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
