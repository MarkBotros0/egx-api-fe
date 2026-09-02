"use client";

/**
 * Learn-page calculators.
 *
 * Each one reproduces a rule the app actually applies elsewhere, so a reader
 * can drag a value and watch the app's own arithmetic move. Where a formula
 * has a canonical home (the stop-loss multiplier, the score bands), these
 * import it rather than restating it — a widget that teaches a different
 * number from the one the app computes is worse than no widget.
 */

import { useId, useMemo, useState } from "react";
import {
  STOP_LOSS_ATR_MULTIPLIER,
  T_BILL_RATE_PCT,
  scoreBand,
  SCORE_BAND_LABEL,
} from "../../lib/constants";
import { V } from "./visuals";

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

function Readout({
  items,
}: {
  items: { label: string; value: string; tone?: "up" | "down" | "plain" }[];
}) {
  const color = (t?: string) =>
    t === "up" ? V.up : t === "down" ? V.down : "rgba(255,255,255,0.9)";
  return (
    <dl className="m-0 mt-1 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-white/[0.03] p-2.5">
      {items.map((i) => (
        <div key={i.label} className="min-w-0">
          <dt className="truncate font-mono text-[9px] uppercase tracking-wider text-white/35">
            {i.label}
          </dt>
          <dd
            className="m-0 mt-0.5 font-mono text-[13px] font-semibold tabular-nums"
            style={{ color: color(i.tone) }}
          >
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const egp = (n: number) =>
  `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} EGP`;

// ---------------------------------------------------------------- RSI

const RSI_READINGS: { at: number; verdict: string; tone: string }[] = [
  { at: 0, verdict: "Deeply oversold. Sellers exhausted — but a falling knife is still falling.", tone: V.up },
  { at: 30, verdict: "Oversold. Worth a look IF the trend and the story hold up.", tone: V.up },
  { at: 45, verdict: "Neutral. RSI is telling you nothing here. Look at trend instead.", tone: "#7f8ea3" },
  { at: 55, verdict: "Neutral, leaning strong. Normal for a healthy uptrend.", tone: "#7f8ea3" },
  { at: 65, verdict: "Getting warm. This app vetoes new entry zones from here up.", tone: V.gold },
  { at: 70, verdict: "Overbought. Don't start a new position. Existing ones: tighten the stop.", tone: V.down },
  { at: 85, verdict: "Very overbought. Late. Chasing here is how beginners buy the top.", tone: V.down },
];

export function RsiPlayground() {
  const [rsi, setRsi] = useState(58);
  const reading = useMemo(
    () => [...RSI_READINGS].reverse().find((r) => rsi >= r.at) ?? RSI_READINGS[0],
    [rsi]
  );

  return (
    <Panel title="RSI — drag to read it" accent={V.gold}>
      <div className="relative mb-3 h-9 overflow-hidden rounded-md">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${V.up}44 0%, ${V.up}22 28%, #7f8ea322 40%, #7f8ea322 60%, ${V.gold}33 68%, ${V.down}44 100%)`,
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

  const stop = support - STOP_LOSS_ATR_MULTIPLIER * atr;
  const riskPerShare = entry - stop;
  const riskPct = (riskPerShare / entry) * 100;

  return (
    <Panel title="Stop-loss — the app's own formula" accent={V.coral}>
      <p className="mb-3 font-mono text-[10px] leading-relaxed text-white/40">
        stop = support − {STOP_LOSS_ATR_MULTIPLIER} × ATR
      </p>
      <Slider label="Entry price you'd pay" value={entry} min={60} max={160} suffix=" EGP" accent={V.coral} onChange={setEntry} />
      <Slider label="Nearest support" value={support} min={50} max={150} suffix=" EGP" accent={V.coral} onChange={setSupport} />
      <Slider label="ATR (typical daily move)" value={atr} min={0.5} max={12} step={0.5} suffix=" EGP" accent={V.coral} onChange={setAtr} />

      <Readout
        items={[
          { label: "Stop goes at", value: `${stop.toFixed(2)} EGP`, tone: "down" },
          {
            label: "Risk per share",
            value: riskPerShare > 0 ? `${riskPerShare.toFixed(2)} EGP` : "—",
            tone: "down",
          },
          {
            label: "That's a drop of",
            value: riskPerShare > 0 ? `${riskPct.toFixed(1)}%` : "—",
            tone: riskPct > 15 ? "down" : "plain",
          },
          {
            label: "Room to support",
            value: `${(((entry - support) / entry) * 100).toFixed(1)}%`,
            tone: entry > support ? "plain" : "up",
          },
        ]}
      />
      <p className="mt-2 text-[10px] leading-relaxed text-white/40">
        {riskPerShare <= 0
          ? "Your entry is already at or below the stop. There is no trade here — the level has broken."
          : riskPct > 15
          ? `A ${riskPct.toFixed(0)}% stop is a long way down. Either wait for a price nearer support, or size the position small enough that a stop-out is survivable.`
          : `Anchoring to support instead of your entry means this number does not change with the price you happened to pay.`}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- sizing

export function PositionSizer() {
  const [portfolio, setPortfolio] = useState(100000);
  const [weight, setWeight] = useState(10);
  const [drop, setDrop] = useState(50);

  const position = (portfolio * weight) / 100;
  const loss = (position * drop) / 100;
  const hit = (loss / portfolio) * 100;
  const verdict =
    weight <= 3
      ? { text: "Thin-liquidity / NILEX sizing. Correct for a name you may struggle to sell.", tone: V.up }
      : weight <= 10
      ? { text: "Inside the house limit of 5–10% per stock. Survivable.", tone: V.up }
      : weight <= 20
      ? { text: "Over the limit. One bad quarter here noticeably dents the whole portfolio.", tone: V.gold }
      : { text: "Concentrated. A single company's bad news is now your portfolio's bad news.", tone: V.down };

  return (
    <Panel title="Position sizing — what a drop actually costs" accent={V.teal}>
      <Slider label="Portfolio value" value={portfolio} min={10000} max={1000000} step={10000} suffix=" EGP" accent={V.teal} onChange={setPortfolio} />
      <Slider label="Put into this one stock" value={weight} min={1} max={40} suffix="%" accent={V.teal} onChange={setWeight} />
      <Slider label="If it then falls" value={drop} min={5} max={80} step={5} suffix="%" accent={V.teal} onChange={setDrop} />

      <Readout
        items={[
          { label: "Position size", value: egp(position) },
          { label: "You lose", value: egp(loss), tone: "down" },
          { label: "Portfolio hit", value: `−${hit.toFixed(1)}%`, tone: "down" },
          {
            label: "To get back you need",
            value: `+${((1 / (1 - hit / 100) - 1) * 100).toFixed(1)}%`,
            tone: "up",
          },
        ]}
      />
      <p
        className="mt-2 text-[10px] leading-relaxed"
        style={{ color: verdict.tone }}
      >
        {verdict.text}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- T-bill

export function TBillRace() {
  const [stockReturn, setStockReturn] = useState(18);
  const [years, setYears] = useState(5);
  const capital = 100000;

  const stockEnd = capital * Math.pow(1 + stockReturn / 100, years);
  const billEnd = capital * Math.pow(1 + T_BILL_RATE_PCT / 100, years);
  const gap = stockEnd - billEnd;
  const winning = gap >= 0;

  const max = Math.max(stockEnd, billEnd);
  const bar = (v: number) => `${Math.max(4, (v / max) * 100)}%`;

  return (
    <Panel title={`Your stock vs the ${T_BILL_RATE_PCT}% T-bill`} accent={V.violet}>
      <Slider label="Stock returns, per year" value={stockReturn} min={-10} max={60} suffix="%" accent={winning ? V.up : V.down} onChange={setStockReturn} />
      <Slider label="Held for" value={years} min={1} max={15} suffix={years === 1 ? " year" : " years"} accent={V.violet} onChange={setYears} />

      <div className="mt-3 space-y-2.5">
        {[
          { label: `Your stock at ${stockReturn}%`, v: stockEnd, c: winning ? V.up : V.down },
          { label: `T-bills at ${T_BILL_RATE_PCT}%, zero risk`, v: billEnd, c: V.violet },
        ].map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-[11px] text-white/55">{r.label}</span>
              <span
                className="font-mono text-[11px] font-semibold tabular-nums"
                style={{ color: r.c }}
              >
                {egp(r.v)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: bar(r.v), background: r.c, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
      </div>

      <p
        className="mt-3 rounded-md bg-white/[0.03] p-2.5 text-[11px] leading-relaxed"
        style={{ color: winning ? V.up : V.down }}
      >
        {winning
          ? `Starting from ${egp(capital)}, the stock ends ${egp(gap)} ahead. It is paying you for the risk you took.`
          : `Starting from ${egp(capital)}, you end ${egp(Math.abs(gap))} BEHIND simply leaving the money in T-bills — while carrying every bit of the stock's risk. This is the loss beginners never see, because the stock still went up.`}
      </p>
    </Panel>
  );
}

// ---------------------------------------------------------------- bands

const BAND_COLOR: Record<string, string> = {
  strong_sell: V.down,
  sell: V.coral,
  hold: "#7f8ea3",
  buy: V.up,
  strong_buy: V.up,
};

export function ScoreBandExplorer() {
  const [score, setScore] = useState(64);
  const band = scoreBand(score);
  const color = BAND_COLOR[band];

  return (
    <Panel title="Composite score — what each band means" accent={color}>
      <div className="relative mb-3 flex h-9 overflow-hidden rounded-md">
        {[
          { w: 20, c: V.down, t: "Very Weak" },
          { w: 20, c: V.coral, t: "Weak" },
          { w: 20, c: "#7f8ea3", t: "Neutral" },
          { w: 20, c: V.up, t: "Strong" },
          { w: 20, c: V.up, t: "Very Strong" },
        ].map((s, i) => (
          <span
            key={i}
            className="grid place-items-center"
            style={{
              width: `${s.w}%`,
              background: `${s.c}${i === 4 ? "55" : "2e"}`,
            }}
          />
        ))}
        <span
          className="absolute top-0 h-full w-[3px] rounded-full transition-[left] duration-100"
          style={{ left: `calc(${score}% - 1.5px)`, background: color }}
        />
      </div>

      <Slider label="Score" value={score} min={0} max={100} accent={color} onChange={setScore} />

      <div className="mt-1 rounded-md bg-white/[0.03] p-2.5">
        <p
          className="font-mono text-[13px] font-semibold uppercase tracking-wider"
          style={{ color }}
        >
          {SCORE_BAND_LABEL[band]}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">
          This describes the stock&apos;s condition today. It is not an
          instruction. Nineteen years of EGX history say a high score is not
          followed by a better return than a low one — so read the category
          reasons underneath it, and decide on those.
        </p>
      </div>
    </Panel>
  );
}
