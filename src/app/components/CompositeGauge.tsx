"use client";

import {
  SCORE_BUY_MAX,
  SCORE_HOLD_MAX,
  SCORE_SELL_MAX,
  SCORE_STRONG_SELL_MAX,
} from "../lib/constants";
import type { CompositeSignal } from "../lib/types";

interface Props {
  score: number | null | undefined;
  signal?: CompositeSignal | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

/** Linear interpolation between two hex colors. */
function lerpColor(a: string, b: string, t: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  t = clamp(t);
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 0xff;
  const ag = (pa >> 8) & 0xff;
  const ab = pa & 0xff;
  const br = (pb >> 16) & 0xff;
  const bg = (pb >> 8) & 0xff;
  const bb = pb & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

export function scoreColor(score: number): string {
  // 0 → deep red, 40 → red/orange, 50 → amber, 60 → green, 100 → bright green
  if (score <= SCORE_STRONG_SELL_MAX) return "#ff3355";
  if (score <= SCORE_SELL_MAX) return lerpColor("#ff3355", "#ff6644", (score - SCORE_STRONG_SELL_MAX) / (SCORE_SELL_MAX - SCORE_STRONG_SELL_MAX));
  if (score <= SCORE_HOLD_MAX) return lerpColor("#ff6644", "#ffaa00", (score - SCORE_SELL_MAX) / (SCORE_HOLD_MAX - SCORE_SELL_MAX));
  if (score <= SCORE_BUY_MAX) return lerpColor("#ffaa00", "#00cc66", (score - SCORE_HOLD_MAX) / (SCORE_BUY_MAX - SCORE_HOLD_MAX));
  return lerpColor("#00cc66", "#00ff88", (score - SCORE_BUY_MAX) / (100 - SCORE_BUY_MAX));
}

const SIZES = {
  sm: { box: 40, stroke: 4, font: 11, signalFont: 0 },
  md: { box: 96, stroke: 8, font: 22, signalFont: 10 },
  lg: { box: 160, stroke: 12, font: 40, signalFont: 13 },
};

export default function CompositeGauge({
  score,
  signal,
  size = "md",
  showLabel,
}: Props) {
  const dims = SIZES[size];
  const cx = dims.box / 2;
  const cy = dims.box / 2;
  const r = (dims.box - dims.stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const hasScore = score !== null && score !== undefined && !Number.isNaN(score);
  const displayScore = hasScore ? Math.round(score as number) : null;
  const color = hasScore ? scoreColor(score as number) : "#4a4a5a";
  const pct = hasScore ? Math.max(0, Math.min(100, score as number)) / 100 : 0;
  const dashOffset = circumference * (1 - pct);

  const pulsing = hasScore && (score as number) <= SCORE_STRONG_SELL_MAX;
  const label = showLabel ?? size !== "sm";

  return (
    <div
      className="inline-flex flex-col items-center"
      aria-label={hasScore ? `Composite score ${displayScore} ${signal ?? ""}` : "Composite score unavailable"}
    >
      <svg
        width={dims.box}
        height={dims.box}
        viewBox={`0 0 ${dims.box} ${dims.box}`}
        className={pulsing ? "animate-pulse" : undefined}
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={dims.stroke}
        />
        {/* Filled arc */}
        {hasScore && (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={dims.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 600ms ease-out, stroke 400ms ease-out" }}
          />
        )}
        {/* Center text */}
        <text
          x={cx}
          y={cy + (size === "sm" ? dims.font / 3 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={dims.font}
          fontWeight="700"
          fill={hasScore ? color : "rgba(255,255,255,0.3)"}
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          {displayScore ?? "—"}
        </text>
        {label && signal && size !== "sm" && (
          <text
            x={cx}
            y={cy + dims.font * 0.7 + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={dims.signalFont}
            fontWeight="600"
            fill="rgba(255,255,255,0.6)"
          >
            {signal}
          </text>
        )}
      </svg>
    </div>
  );
}
