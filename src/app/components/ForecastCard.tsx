"use client";

import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

import LearnTooltip from "./LearnTooltip";
import type { StockForecast, StockOutcomeBand } from "@/app/lib/types";

/**
 * WHAT THIS CARD MUST NEVER DO, AND WHY
 * -------------------------------------
 * It used to render three prices — `finalP5.toFixed(2)`, `finalP50.toFixed(2)`,
 * `finalP95.toFixed(2)` — with the median tile coloured green when it sat above
 * spot. That median was the trailing 400-day mean return compounded forward: a
 * mechanical extrapolation dressed as a call. A price to two decimals asserts a
 * precision this app measured itself not to have, and a colour on it asserts a
 * direction. Both are gone, and `tests/test_forecast_presentation.py` fails if
 * either comes back.
 *
 * Coverage percentages are read from the payload, never typed in here. The old
 * "68% of days" was hardcoded and wrong by eleven points.
 */

interface ForecastCardProps {
  forecast: StockForecast | null | undefined;
  symbol: string;
}

/** Round to the precision the measurement supports — never more. */
function coarse(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export default function ForecastCard({ forecast, symbol }: ForecastCardProps) {
  if (!forecast || (!forecast.expected_move && !forecast.outcome_band)) {
    return null;
  }

  const { expected_move, outcome_band } = forecast;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            <LearnTooltip
              term="Outcome range"
              explanation="How far this stock has typically travelled over a given stretch of time, fitted to the Egyptian market's own history. It says nothing about direction — the range is deliberately centred on today's price."
            >
              <span>Typical moves &amp; outcome range</span>
            </LearnTooltip>
          </h3>
          <p className="mt-0.5 text-[11px] text-white/40">
            Ranges, not predictions. No direction is implied.
          </p>
        </div>
        <Link
          href="/learn#expected_move"
          className="shrink-0 text-[10px] text-accent/70 hover:text-accent"
        >
          Learn →
        </Link>
      </div>

      {expected_move && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <MoveTile
            label="Typical day"
            value={expected_move.daily_pct}
            coverage={expected_move.daily_coverage_pct}
          />
          <MoveTile
            label="Typical week"
            value={expected_move.weekly_pct}
            coverage={expected_move.weekly_coverage_pct}
          />
          <MoveTile
            label="Typical month"
            value={expected_move.monthly_pct}
            coverage={expected_move.monthly_coverage_pct}
          />
        </div>
      )}

      {outcome_band && <OutcomeCone data={outcome_band} symbol={symbol} />}

      <p className="mt-3 text-[10px] leading-relaxed text-white/30">
        Fitted to how Egyptian stocks have actually moved
        {outcome_band
          ? ` — ${outcome_band.calibration.n_observations.toLocaleString()} past checks, last fitted ${outcome_band.calibration.fitted_at}`
          : ""}
        . A range can still be wrong: news, a devaluation or a suspension can put
        the price outside it.{" "}
        <Link href="/calibration" className="text-accent/60 hover:text-accent">
          See how often these ranges held →
        </Link>
      </p>
    </div>
  );
}

function MoveTile({
  label,
  value,
  coverage,
}: {
  label: string;
  value: number;
  coverage: number;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] text-white/40">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-white">
        ±{value.toFixed(1)}%
      </p>
      {/* Measured coverage, and its complement. Readers systematically misjudge
          which event a probability refers to unless the other side is stated. */}
      <p className="mt-0.5 text-[9px] leading-tight text-white/30">
        {Math.round(coverage)}% land inside
        <br />
        {100 - Math.round(coverage)}% are bigger
      </p>
    </div>
  );
}

function OutcomeCone({
  data,
  symbol,
}: {
  data: StockOutcomeBand;
  symbol: string;
}) {
  const { bands, current_price, days, endpoint } = data;
  if (!bands.length) return null;

  const inner = bands[0];
  const outer = bands[bands.length - 1];

  // Recharts draws stacked areas, so each band is expressed as a base plus a
  // height rather than as absolute lo/hi pairs.
  const chartData = [
    {
      day: 0,
      outerLo: current_price,
      outerBand: 0,
      innerLo: current_price,
      innerBand: 0,
    },
    ...Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      outerLo: outer.lo[i],
      outerBand: outer.hi[i] - outer.lo[i],
      innerLo: inner.lo[i],
      innerBand: inner.hi[i] - inner.lo[i],
    })),
  ];

  const formatPrice = (v: number) =>
    v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(0);

  return (
    <div>
      <p className="mb-2 text-[11px] leading-relaxed text-white/50">
        Over the next {days} trading days, {symbol} has historically ended
        between{" "}
        <span className="font-mono text-white/70">{coarse(endpoint.lo)}</span>{" "}
        and{" "}
        <span className="font-mono text-white/70">{coarse(endpoint.hi)}</span>{" "}
        EGP about {endpoint.coverage_pct}% of the time — so roughly{" "}
        {100 - endpoint.coverage_pct}% of the time it ended outside, about as
        often below as above.
      </p>

      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.2)" }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={formatPrice}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
            }}
            formatter={(value: number, name: string) => {
              if (name === "outerLo")
                return [`${coarse(value)} EGP`, `${outer.coverage_pct}% band, low`];
              if (name === "innerLo")
                return [`${coarse(value)} EGP`, `${inner.coverage_pct}% band, low`];
              return null;
            }}
            labelFormatter={(day) => (day === 0 ? "Today" : `Day +${day}`)}
          />

          <ReferenceLine
            y={current_price}
            stroke="rgba(255,255,255,0.3)"
            strokeDasharray="3 3"
          />

          {/* Outer band */}
          <Area
            type="monotone"
            dataKey="outerLo"
            stackId="outer"
            stroke="none"
            fill="transparent"
            name="outerLo"
          />
          <Area
            type="monotone"
            dataKey="outerBand"
            stackId="outer"
            stroke="none"
            fill="rgba(68,136,255,0.10)"
            name="outerBand"
          />
          {/* Inner band, drawn over it */}
          <Area
            type="monotone"
            dataKey="innerLo"
            stackId="inner"
            stroke="none"
            fill="transparent"
            name="innerLo"
          />
          <Area
            type="monotone"
            dataKey="innerBand"
            stackId="inner"
            stroke="none"
            fill="rgba(68,136,255,0.18)"
            name="innerBand"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center gap-4 text-[9px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[rgba(68,136,255,0.28)]" />
          {inner.coverage_pct}% of outcomes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-sm bg-[rgba(68,136,255,0.12)]" />
          {outer.coverage_pct}% of outcomes
        </span>
      </div>
    </div>
  );
}
