"use client";

/**
 * Learn-page calculators.
 *
 * Each one reproduces a rule the app actually applies elsewhere, so a reader
 * can drag a value and watch the app's own arithmetic move. The formulas and
 * verdict copy live in lib/learnWidgets.ts (shared with the mobile app), which
 * imports each rule from lib/constants.ts rather than restating it — a widget
 * that teaches a different number from the one the app computes is worse
 * than no widget.
 */

import { useId, useState } from "react";
import { STOP_LOSS_ATR_MULTIPLIER } from "../../lib/constants";
import { V } from "../../lib/learnVisuals";
import {
  RSI_STRIP_STOPS,
  SCORE_BAND_SEGMENTS,
  SCORE_EXPLORER_NOTE,
  TBILL_TITLE,
  egp,
  positionSizing,
  readoutColor,
  rsiReading,
  scoreBandReading,
  stopLossPlan,
  tBillRace,
  type ReadoutItem,
} from "../../lib/learnWidgets";

// ---------------------------------------------------------------- chrome

function Panel({
  title,
  children,
  accent = V.accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-black/25">
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
        />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/45">
          {title}
        </span>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-white/25">
          try it
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  accent = V.accent,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  accent?: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[11px] text-white/55">
          {label}
        </label>
        <span
          className="font-mono text-[12px] font-semibold tabular-nums"
          style={{ color: accent }}
        >
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full cursor-pointer bg-transparent"
        style={{ accentColor: accent }}
      />
    </div>
  );
}

function Readout({ items }: { items: ReadoutItem[] }) {
  return (
    <dl className="m-0 mt-1 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-white/[0.03] p-2.5">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="truncate font-mono text-[9px] uppercase tracking-wider text-white/35">
            {i.label}
          </dt>
          <dd
            className="m-0 mt-0.5 font-mono text-[13px] font-semibold tabular-nums"
            style={{ color: readoutColor(i.tone) }}
          >
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------------------------------------------------------------- RSI

export function RsiPlayground() {
  const [rsi, setRsi] = useState(58);
  const reading = rsiReading(rsi);

  return (
    <Panel title="RSI — drag to read it" accent={V.gold}>
      <div className="relative mb-3 h-9 overflow-hidden rounded-md">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${RSI_STRIP_STOPS.map(
              (s) => `${s.color} ${s.offset}%`
            ).join(", ")})`,
          }}
        />
        {[30, 70].map((t) => (
          <span
            key={t}
            className="absolute inset-y-0 w-px bg-white/25"
            style={{ left: `${t}%` }}
          />
        ))}
        <span
          className="absolute top-0 h-full w-[3px] rounded-full transition-[left] duration-100"
          style={{ left: `calc(${rsi}% - 1.5px)`, background: reading.tone }}
        />
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-wider text-white/50">
          oversold
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-wider text-white/50">
          overbought
        </span>
      </div>

      <Slider
        label="RSI reading"
        value={rsi}
        min={0}
        max={100}
        accent={reading.tone}
        onChange={setRsi}
      />
      <p
        className="mt-1 rounded-md bg-white/[0.03] p-2.5 text-[11px] leading-relaxed"
        style={{ color: reading.tone }}
      >
        {reading.verdict}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- stop-loss

export function StopLossCalculator() {
  const [support, setSupport] = useState(98);
  const [atr, setAtr] = useState(4);
  const [entry, setEntry] = useState(104);
  const plan = stopLossPlan(entry, support, atr);

  return (
    <Panel title="Stop-loss — the app's own formula" accent={V.coral}>
      <p className="mb-3 font-mono text-[10px] leading-relaxed text-white/40">
        stop = support − {STOP_LOSS_ATR_MULTIPLIER} × ATR
      </p>
      <Slider label="Entry price you'd pay" value={entry} min={60} max={160} suffix=" EGP" accent={V.coral} onChange={setEntry} />
      <Slider label="Nearest support" value={support} min={50} max={150} suffix=" EGP" accent={V.coral} onChange={setSupport} />
      <Slider label="ATR (typical daily move)" value={atr} min={0.5} max={12} step={0.5} suffix=" EGP" accent={V.coral} onChange={setAtr} />

      <Readout items={plan.readout} />
      <p className="mt-2 text-[10px] leading-relaxed text-white/40">{plan.advice}</p>
    </Panel>
  );
}

// ---------------------------------------------------------------- sizing

export function PositionSizer() {
  const [portfolio, setPortfolio] = useState(100000);
  const [weight, setWeight] = useState(10);
  const [drop, setDrop] = useState(50);
  const sizing = positionSizing(portfolio, weight, drop);

  return (
    <Panel title="Position sizing — what a drop actually costs" accent={V.teal}>
      <Slider label="Portfolio value" value={portfolio} min={10000} max={1000000} step={10000} suffix=" EGP" accent={V.teal} onChange={setPortfolio} />
      <Slider label="Put into this one stock" value={weight} min={1} max={40} suffix="%" accent={V.teal} onChange={setWeight} />
      <Slider label="If it then falls" value={drop} min={5} max={80} step={5} suffix="%" accent={V.teal} onChange={setDrop} />

      <Readout items={sizing.readout} />
      <p
        className="mt-2 text-[10px] leading-relaxed"
        style={{ color: sizing.verdict.tone }}
      >
        {sizing.verdict.text}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- T-bill

export function TBillRace() {
  const [stockReturn, setStockReturn] = useState(18);
  const [years, setYears] = useState(5);
  const race = tBillRace(stockReturn, years);

  return (
    <Panel title={TBILL_TITLE} accent={V.violet}>
      <Slider label="Stock returns, per year" value={stockReturn} min={-10} max={60} suffix="%" accent={race.winning ? V.up : V.down} onChange={setStockReturn} />
      <Slider label="Held for" value={years} min={1} max={15} suffix={years === 1 ? " year" : " years"} accent={V.violet} onChange={setYears} />

      <div className="mt-3 space-y-2.5">
        {race.rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-white/55">{r.label}</span>
              <span
                className="font-mono text-[11px] font-semibold tabular-nums"
                style={{ color: r.color }}
              >
                {egp(r.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${r.barPct}%`, background: r.color, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>

      <p
        className="mt-3 rounded-md bg-white/[0.03] p-2.5 text-[11px] leading-relaxed"
        style={{ color: race.winning ? V.up : V.down }}
      >
        {race.message}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- bands

export function ScoreBandExplorer() {
  const [score, setScore] = useState(64);
  const reading = scoreBandReading(score);

  return (
    <Panel title="Composite score — what each band means" accent={reading.color}>
      <div className="relative mb-3 flex h-9 overflow-hidden rounded-md">
        {SCORE_BAND_SEGMENTS.map((s, i) => (
          <span
            key={i}
            className="grid place-items-center"
            style={{
              width: `${s.width}%`,
              background: `${s.color}${i === 4 ? "55" : "2e"}`,
            }}
          />
        ))}
        <span
          className="absolute top-0 h-full w-[3px] rounded-full transition-[left] duration-100"
          style={{ left: `calc(${score}% - 1.5px)`, background: reading.color }}
        />
      </div>

      <Slider label="Score" value={score} min={0} max={100} accent={reading.color} onChange={setScore} />

      <div className="mt-1 rounded-md bg-white/[0.03] p-2.5">
        <p
          className="font-mono text-[13px] font-semibold uppercase tracking-wider"
          style={{ color: reading.color }}
        >
          {reading.label}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
          {SCORE_EXPLORER_NOTE}
        </p>
      </div>
    </Panel>
  );
}
