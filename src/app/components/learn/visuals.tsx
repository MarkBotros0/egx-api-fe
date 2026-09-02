"use client";

/**
 * Learn-page diagram library.
 *
 * Hand-rolled inline SVG — no charting dependency. These render schematics,
 * not market data: the numbers are illustrative and chosen to make one idea
 * legible at a glance on a 360px screen.
 *
 * Colour rule for this whole file: `up` (gain green) and `down` (loss red)
 * mean a real direction in the data. They are never used as decoration. The
 * module hues carry identity instead, so a green line on the Learn page means
 * the same thing it means on the stock page.
 */

import { useId } from "react";

// ---------------------------------------------------------------- palette

export const V = {
  up: "#00ff88",
  down: "#ff3355",
  accent: "#4488ff",
  gold: "#e8b04b",
  teal: "#2fd3c0",
  coral: "#ff7a59",
  violet: "#a68bff",
  grid: "rgba(255,255,255,0.05)",
  axis: "rgba(255,255,255,0.18)",
  ink: "rgba(255,255,255,0.45)",
  inkBright: "rgba(255,255,255,0.75)",
} as const;

// ---------------------------------------------------------------- frame

export function VisualFrame({
  children,
  caption,
  legend,
}: {
  children: React.ReactNode;
  caption?: string;
  legend?: { color: string; label: string; dash?: boolean }[];
}) {
  return (
    <figure className="m-0 overflow-hidden rounded-lg border border-white/[0.07] bg-black/25">
      <div className="px-1 pt-1">{children}</div>
      {(legend?.length || caption) && (
        <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.05] px-3 py-2">
          {legend?.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-[2px] w-3.5 rounded-full"
                style={{
                  background: l.dash
                    ? `repeating-linear-gradient(90deg, ${l.color} 0 3px, transparent 3px 6px)`
                    : l.color,
                }}
              />
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                {l.label}
              </span>
            </span>
          ))}
          {caption && (
            <span className="text-[10px] leading-snug text-white/35">{caption}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

// ---------------------------------------------------------------- helpers

type Nums = (number | null)[];

const W = 320;

function extent(sets: Nums[]): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const s of sets) {
    for (const v of s) {
      if (v === null || v === undefined || !Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  return [min, max];
}

/** Straight-segment path that breaks across nulls, so leading NaNs leave a gap. */
function toPath(
  values: Nums,
  x: (i: number) => number,
  y: (v: number) => number
): string {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v === null || v === undefined || !Number.isFinite(v)) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

// ---------------------------------------------------------------- MiniChart

export interface ChartLine {
  values: Nums;
  color: string;
  width?: number;
  dash?: string;
  label?: string;
}
export interface ChartLevel {
  value: number;
  color: string;
  label?: string;
  dash?: string;
}
export interface ChartMarker {
  index: number;
  color: string;
  label?: string;
  /** Where the label sits relative to the point. */
  place?: "above" | "below";
}
export interface ChartShade {
  from: number;
  to: number;
  color: string;
  label?: string;
}

/**
 * The workhorse. A price path plus any combination of overlay lines, a
 * shaded channel (Bollinger), horizontal rails (support/resistance/Fib),
 * point markers and vertical highlight regions.
 */
export function MiniChart({
  series,
  lines = [],
  band,
  levels = [],
  markers = [],
  shades = [],
  height = 140,
  priceColor = V.inkBright,
  fill = true,
  caption,
  legend,
  labelPad = 34,
}: {
  series: number[];
  lines?: ChartLine[];
  band?: { upper: Nums; lower: Nums; color: string };
  levels?: ChartLevel[];
  markers?: ChartMarker[];
  shades?: ChartShade[];
  height?: number;
  priceColor?: string;
  fill?: boolean;
  caption?: string;
  legend?: { color: string; label: string; dash?: boolean }[];
  /** Right gutter reserved for level labels. */
  labelPad?: number;
}) {
  const H = height;
  const padT = 12;
  const padB = 12;
  const padL = 6;
  const padR = 6 + (levels.some((l) => l.label) ? labelPad : 0);

  const [min, max] = extent([
    series,
    ...lines.map((l) => l.values),
    ...(band ? [band.upper, band.lower] : []),
    levels.map((l) => l.value),
  ]);
  const pad = (max - min) * 0.1;
  const lo = min - pad;
  const hi = max + pad;

  const n = series.length;
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, n - 1);
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);

  // The gradient id must be unique per RENDERED chart, not per series: several
  // charts reuse the same illustrative series with different colours, and a
  // repeated id makes every `url(#id)` resolve to the first one on the page.
  // useId is stable across server and client, so hydration matches.
  const gid = `mc${useId().replace(/:/g, "")}`;

  const areaPath =
    fill && n > 1
      ? `${toPath(series, x, y)}L${x(n - 1).toFixed(1)},${(H - padB).toFixed(
          1
        )}L${x(0).toFixed(1)},${(H - padB).toFixed(1)}Z`
      : "";

  return (
    <VisualFrame caption={caption} legend={legend}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={caption ?? "Illustrative price chart"}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={priceColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={priceColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* vertical highlight regions */}
        {shades.map((s, i) => (
          <g key={`sh${i}`}>
            <rect
              x={x(s.from)}
              y={padT}
              width={Math.max(1, x(s.to) - x(s.from))}
              height={H - padT - padB}
              fill={s.color}
              opacity={0.1}
            />
            {s.label && (
              <text
                x={(x(s.from) + x(s.to)) / 2}
                y={padT + 9}
                textAnchor="middle"
                className="font-mono"
                fontSize="8"
                fill={s.color}
                opacity={0.9}
              >
                {s.label}
              </text>
            )}
          </g>
        ))}

        {/* volatility channel */}
        {band && (
          <path
            d={`${toPath(band.upper, x, y)}${toPath(
              [...band.lower].reverse(),
              (i) => x(n - 1 - i),
              y
            ).replace(/^M/, "L")}Z`}
            fill={band.color}
            opacity={0.12}
          />
        )}

        {/* horizontal rails */}
        {levels.map((l, i) => (
          <g key={`lv${i}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(l.value)}
              y2={y(l.value)}
              stroke={l.color}
              strokeWidth="1"
              strokeDasharray={l.dash ?? "3 3"}
              opacity={0.8}
            />
            {l.label && (
              <text
                x={W - padR + 4}
                y={y(l.value) + 3}
                className="font-mono"
                fontSize="8"
                fill={l.color}
              >
                {l.label}
              </text>
            )}
          </g>
        ))}

        {/* overlays */}
        {lines.map((l, i) => (
          <path
            key={`ln${i}`}
            d={toPath(l.values, x, y)}
            fill="none"
            stroke={l.color}
            strokeWidth={l.width ?? 1.5}
            strokeDasharray={l.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* price */}
        {fill && <path d={areaPath} fill={`url(#${gid})`} />}
        <path
          d={toPath(series, x, y)}
          fill="none"
          stroke={priceColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* markers */}
        {markers.map((m, i) => {
          const px = x(m.index);
          const py = y(series[m.index]);
          const above = m.place !== "below";
          return (
            <g key={`mk${i}`}>
              <circle cx={px} cy={py} r="4.5" fill={m.color} opacity={0.25} />
              <circle
                cx={px}
                cy={py}
                r="2.5"
                fill={m.color}
                stroke="#0a0a0f"
                strokeWidth="1"
              />
              {m.label && (
                <text
                  x={Math.min(Math.max(px, 26), W - padR - 12)}
                  y={above ? py - 8 : py + 14}
                  textAnchor="middle"
                  className="font-mono"
                  fontSize="8"
                  fill={m.color}
                >
                  {m.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- ZoneScale

export interface Zone {
  from: number;
  to: number;
  color: string;
  label?: string;
}

/**
 * A 0–100 rail with meaning-bearing zones and one or more readings on it.
 * Used for RSI, MFI, Stochastic, ADX and the composite score bands.
 */
export function ZoneScale({
  zones,
  markers,
  min = 0,
  max = 100,
  ticks,
  unit = "",
  caption,
  height = 74,
}: {
  zones: Zone[];
  markers: { value: number; label: string; color?: string }[];
  min?: number;
  max?: number;
  ticks?: number[];
  unit?: string;
  caption?: string;
  height?: number;
}) {
  const H = height;
  const padL = 10;
  const padR = 10;
  const barY = 30;
  const barH = 14;
  const x = (v: number) =>
    padL + ((v - min) / (max - min)) * (W - padL - padR);

  return (
    <VisualFrame caption={caption}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={caption ?? "Scale diagram"}
      >
        {zones.map((z, i) => (
          <g key={`z${i}`}>
            <rect
              x={x(z.from)}
              y={barY}
              width={Math.max(0, x(z.to) - x(z.from))}
              height={barH}
              fill={z.color}
              opacity={0.28}
            />
            {z.label && (
              <text
                x={(x(z.from) + x(z.to)) / 2}
                y={barY + barH + 11}
                textAnchor="middle"
                className="font-mono"
                fontSize="8"
                fill={z.color}
                opacity={0.95}
              >
                {z.label}
              </text>
            )}
          </g>
        ))}
        <rect
          x={padL}
          y={barY}
          width={W - padL - padR}
          height={barH}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
        />

        {(ticks ?? [min, max]).map((t) => (
          <text
            key={`t${t}`}
            x={x(t)}
            y={barY + barH + 22}
            textAnchor="middle"
            className="font-mono"
            fontSize="8"
            fill={V.ink}
          >
            {t}
            {unit}
          </text>
        ))}

        {markers.map((m, i) => (
          <g key={`m${i}`}>
            <path
              d={`M${x(m.value)},${barY - 3} l-4,-6 h8 Z`}
              fill={m.color ?? "#fff"}
            />
            <text
              x={Math.min(Math.max(x(m.value), 30), W - 30)}
              y={barY - 13}
              textAnchor="middle"
              className="font-mono"
              fontSize="9"
              fill={m.color ?? "#fff"}
            >
              {m.label}
            </text>
          </g>
        ))}
      </svg>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- BarCompare

/** Side-by-side magnitudes: T-bill vs stock, leader vs laggard, volume tiers. */
export function BarCompare({
  bars,
  unit = "%",
  caption,
  baseline,
}: {
  bars: { label: string; value: number; color: string; note?: string }[];
  unit?: string;
  caption?: string;
  baseline?: { value: number; label: string; color: string };
}) {
  const maxV = Math.max(
    ...bars.map((b) => Math.abs(b.value)),
    baseline ? Math.abs(baseline.value) : 0,
    1
  );
  return (
    <VisualFrame caption={caption}>
      <div className="space-y-2.5 p-3">
        {bars.map((b, bi) => (
          <div key={`${bi}-${b.label}`}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-white/65">{b.label}</span>
              <span
                className="font-mono text-[11px] font-semibold tabular-nums"
                style={{ color: b.color }}
              >
                {b.value > 0 && unit === "%" ? "+" : ""}
                {b.value}
                {unit}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${(Math.abs(b.value) / maxV) * 100}%`,
                  background: b.color,
                  opacity: 0.85,
                }}
              />
              {baseline && (
                <div
                  className="absolute inset-y-0 w-px"
                  style={{
                    left: `${(Math.abs(baseline.value) / maxV) * 100}%`,
                    background: baseline.color,
                  }}
                />
              )}
            </div>
            {b.note && (
              <p className="mt-1 text-[10px] leading-snug text-white/35">{b.note}</p>
            )}
          </div>
        ))}
        {baseline && (
          <p className="flex items-center gap-1.5 pt-0.5">
            <span
              className="inline-block h-3 w-px"
              style={{ background: baseline.color }}
            />
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
              {baseline.label}
            </span>
          </p>
        )}
      </div>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- StepFlow

/**
 * A numbered sequence. Numbering is used here because the content genuinely
 * is ordered — the decision framework and T+2 settlement both break if you
 * reorder them.
 */
export function StepFlow({
  steps,
  accent = V.accent,
  caption,
}: {
  steps: { title: string; text: string }[];
  accent?: string;
  caption?: string;
}) {
  return (
    <VisualFrame caption={caption}>
      <ol className="m-0 list-none space-y-0 p-3">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 pb-3 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[11px] top-6 bottom-0 w-px"
                style={{ background: "rgba(255,255,255,0.09)" }}
              />
            )}
            <span
              className="relative z-10 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold"
              style={{
                background: `${accent}2b`,
                color: accent,
                border: `1px solid ${accent}66`,
              }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-semibold text-white/85">{s.title}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/45">
                {s.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- Donut

/** Portfolio allocation: sizing, diversification, concentration. */
export function AllocationDonut({
  slices,
  centerLabel,
  centerSub,
  caption,
}: {
  slices: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerSub?: string;
  caption?: string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <VisualFrame caption={caption}>
      <div className="flex items-center gap-4 p-3">
        <svg viewBox="0 0 110 110" className="h-[110px] w-[110px] shrink-0">
          <g transform="rotate(-90 55 55)">
            {slices.map((s) => {
              const len = (s.value / total) * C;
              const el = (
                <circle
                  key={s.label}
                  cx="55"
                  cy="55"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="13"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  opacity={0.9}
                />
              );
              offset += len;
              return el;
            })}
          </g>
          <text
            x="55"
            y="53"
            textAnchor="middle"
            className="font-mono"
            fontSize="15"
            fontWeight="600"
            fill="#fff"
          >
            {centerLabel}
          </text>
          {centerSub && (
            <text
              x="55"
              y="66"
              textAnchor="middle"
              className="font-mono"
              fontSize="7"
              fill={V.ink}
            >
              {centerSub}
            </text>
          )}
        </svg>
        <ul className="m-0 min-w-0 flex-1 list-none space-y-1.5 p-0">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/60">
                {s.label}
              </span>
              <span className="font-mono text-[11px] tabular-nums text-white/80">
                {Math.round((s.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- Correlation

export function CorrelationGrid({
  labels,
  matrix,
  caption,
}: {
  labels: string[];
  matrix: number[][];
  caption?: string;
}) {
  // +1 is concentrated risk (red), 0 is unrelated, -1 is true diversification.
  const tint = (v: number) => (v > 0.15 ? V.down : v < -0.15 ? V.up : "#7f8ea3");

  const cells: React.ReactNode[] = [<span key="corner" />];
  labels.forEach((l) =>
    cells.push(
      <span
        key={`h-${l}`}
        className="pb-0.5 text-center font-mono text-[9px] uppercase text-white/40"
      >
        {l}
      </span>
    )
  );
  matrix.forEach((row, r) => {
    cells.push(
      <span
        key={`rh-${r}`}
        className="self-center pr-1 font-mono text-[9px] uppercase text-white/40"
      >
        {labels[r]}
      </span>
    );
    row.forEach((v, c) => {
      const self = r === c;
      cells.push(
        <span
          key={`c-${r}-${c}`}
          className="grid aspect-square place-items-center rounded font-mono text-[9px] tabular-nums text-white/90"
          style={{
            backgroundColor: tint(v),
            opacity: self ? 0.18 : 0.22 + Math.abs(v) * 0.55,
          }}
        >
          {v.toFixed(1)}
        </span>
      );
    });
  });

  return (
    <VisualFrame caption={caption}>
      <div className="p-3">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `minmax(34px,auto) repeat(${labels.length}, minmax(0,1fr))`,
          }}
        >
          {cells}
        </div>
      </div>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- Cone

/** Monte Carlo / expected-move fan: percentile bands widening over time. */
export function ConeChart({
  days = 60,
  start = 100,
  drift = 0.0008,
  vol = 0.018,
  caption,
}: {
  days?: number;
  start?: number;
  drift?: number;
  vol?: number;
  caption?: string;
}) {
  const H = 150;
  const padT = 14;
  const padB = 18;
  const padL = 8;
  const padR = 40;

  // Analytic percentile envelope — the same shape 1,000 simulated paths make.
  const zs = [-1.645, -0.674, 0, 0.674, 1.645];
  const bands = zs.map((z) =>
    Array.from({ length: days + 1 }, (_, t) =>
      start * Math.exp(drift * t + z * vol * Math.sqrt(t))
    )
  );
  const lo = Math.min(...bands[0]) * 0.99;
  const hi = Math.max(...bands[4]) * 1.01;
  const x = (i: number) => padL + (i * (W - padL - padR)) / days;
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);

  const ribbon = (a: number[], b: number[]) =>
    `${a.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}` +
    `${b
      .map((v, i) => `L${x(b.length - 1 - i).toFixed(1)},${y(b[b.length - 1 - i]).toFixed(1)}`)
      .join("")}Z`;

  return (
    <VisualFrame caption={caption}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Simulated outcome cone">
        <path d={ribbon(bands[4], bands[0])} fill={V.accent} opacity={0.1} />
        <path d={ribbon(bands[3], bands[1])} fill={V.accent} opacity={0.18} />
        <path
          d={bands[2].map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("")}
          fill="none"
          stroke={V.accent}
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <line
          x1={padL}
          x2={W - padR}
          y1={y(start)}
          y2={y(start)}
          stroke={V.axis}
          strokeWidth="1"
        />
        {[
          { v: bands[4][days], t: "95th", c: V.up },
          { v: bands[2][days], t: "median", c: V.accent },
          { v: bands[0][days], t: "5th", c: V.down },
        ].map((m) => (
          <text
            key={m.t}
            x={W - padR + 4}
            y={y(m.v) + 3}
            className="font-mono"
            fontSize="8"
            fill={m.c}
          >
            {m.t}
          </text>
        ))}
        <text x={padL} y={H - 5} className="font-mono" fontSize="8" fill={V.ink}>
          today
        </text>
        <text
          x={W - padR}
          y={H - 5}
          textAnchor="end"
          className="font-mono"
          fontSize="8"
          fill={V.ink}
        >
          +{days} days
        </text>
      </svg>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- Ledger

/** A two-column "what actually happens" ledger — settlement, tax, fees. */
export function LedgerRows({
  rows,
  caption,
}: {
  rows: { left: string; right: string; tone?: "up" | "down" | "muted" }[];
  caption?: string;
}) {
  const tone = (t?: string) =>
    t === "up" ? V.up : t === "down" ? V.down : "rgba(255,255,255,0.75)";
  return (
    <VisualFrame caption={caption}>
      <dl className="m-0 divide-y divide-white/[0.05] p-0">
        {/* Keyed by index: a ledger legitimately repeats a label — the CBE card
            asks "→ effect on stocks" twice, once per scenario. */}
        {rows.map((r, i) => (
          <div
            key={`${i}-${r.left}`}
            className="flex items-baseline justify-between gap-3 px-3 py-2"
          >
            <dt className="text-[11px] text-white/50">{r.left}</dt>
            <dd
              className="m-0 font-mono text-[11px] font-medium tabular-nums"
              style={{ color: tone(r.tone) }}
            >
              {r.right}
            </dd>
          </div>
        ))}
      </dl>
    </VisualFrame>
  );
}

// ---------------------------------------------------------------- series gen

/**
 * Deterministic pseudo-random walk. Seeded so a diagram looks identical on
 * every render and between server and client — a Math.random() series would
 * hydrate-mismatch and flicker.
 */
export function walk(
  n: number,
  seed: number,
  { start = 100, drift = 0, vol = 1 } = {}
): number[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v += drift + rnd() * vol * 2;
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

/** Trailing simple moving average, null until the window fills. */
export function smaOf(values: number[], period: number): Nums {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let k = i - period + 1; k <= i; k++) sum += values[k];
    return Math.round((sum / period) * 100) / 100;
  });
}
