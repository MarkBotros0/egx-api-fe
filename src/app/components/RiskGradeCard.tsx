"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import LearnTooltip from "./LearnTooltip";
import { fetchRisk, type RiskRow, type RiskResponse } from "@/app/lib/api";

/**
 * The per-stock risk grade — the strongest measured surface in this app.
 *
 * Past 63-day volatility predicts the next 126 days' realized volatility at
 * rank IC +0.56 (t=+24 non-overlapping) and max drawdown at +0.43 (t=+17). For
 * scale, the composite score's IC against forward RETURNS is approximately zero
 * and slightly negative. Volatility is persistent; returns are not.
 *
 * THE RULE THIS CARD EXISTS UNDER
 * -------------------------------
 * It must never imply a return. Low volatility does rank positively against
 * forward returns, but the realisable spread is weak (t=1.70) and the mean by
 * quintile is flat-to-inverted — high-vol EGX names are lottery tickets whose
 * few winners lift the mean while the median is clearly worse. So every figure
 * here is about MOVEMENT and DRAWDOWN, in the past tense, and the copy says so
 * out loud. `tests/test_risk_grade.py::test_risk_grade_makes_no_return_claim`
 * guards the backend half.
 *
 * COLOUR
 * ------
 * Deliberately NOT the app's `gain`/`loss` pair. Those mean a real direction in
 * the data (see the Learn-page colour rule), and a risk band has no direction —
 * it is intensity. This uses a cool-to-hot ramp instead, so "Wild" reads as
 * "moves a lot, digs deep holes" rather than "this loses money".
 */

const BAND_COLOR: Record<string, string> = {
  calm: "#4488ff",
  steady: "#5fa8d3",
  average: "#e8c468",
  jumpy: "#f0913f",
  wild: "#ff3355",
};

const BAND_ORDER = ["calm", "steady", "average", "jumpy", "wild"] as const;

const BAND_BLURB: Record<string, string> = {
  calm: "moves least of the tradeable EGX names",
  steady: "moves less than most",
  average: "moves about as much as the typical EGX stock",
  jumpy: "moves more than most",
  wild: "moves most of the tradeable EGX names",
};

function agoLabel(iso?: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const hours = (Date.now() - then) / 36e5;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export default function RiskGradeCard({ symbol }: { symbol: string }) {
  const [res, setRes] = useState<RiskResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    setRes(null);
    setFailed(false);
    fetchRisk(symbol)
      .then((r) => live && setRes(r))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [symbol]);

  // A 404 means this symbol has not been measured yet, which is a normal state
  // while the scheduled snapshot walks the universe — not an error worth a red
  // box on the stock page. Render nothing rather than something alarming.
  if (failed) return null;

  if (!res) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-16 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  // Match on symbol rather than trusting position. `/api/risk?symbol=` does
  // narrow `data` to one row, but an unfiltered response is sorted by rank, so
  // a dropped query param would silently render the calmest stock in the market
  // under this page's ticker.
  const wanted = symbol.trim().toUpperCase();
  const row: RiskRow | undefined = res.data?.find((r) => r.symbol === wanted);
  if (!row) return null;

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            <LearnTooltip
              term="Risk grade"
              explanation="Where this stock sits against every tradeable EGX stock on how much it moves. Built from the last 63 days of price swings, which historically predicted the next six months' swings and drawdowns well. It says nothing about direction."
            >
              <span>Risk grade</span>
            </LearnTooltip>
          </h3>
          <p className="mt-0.5 text-[11px] text-white/40">
            How much this moves — not which way.
          </p>
        </div>
        <Link
          href="/learn#risk-management"
          className="shrink-0 text-[10px] text-accent/70 hover:text-accent"
        >
          Learn →
        </Link>
      </div>

      {row.band ? (
        <Graded row={row} res={res} band={row.band} />
      ) : (
        <Ungraded row={row} />
      )}
    </div>
  );
}

function Graded({
  row,
  res,
  band,
}: {
  row: RiskRow;
  res: RiskResponse;
  /** Narrowed by the caller — this branch only renders for a graded row. */
  band: NonNullable<RiskRow["band"]>;
}) {
  const color = BAND_COLOR[band] ?? "#4488ff";
  const label = row.band_label ?? band;
  const pct = row.pct_rank ?? 0;
  const hist = row.historical;
  const ago = agoLabel(res.oldest_measurement ?? row.measured_at);

  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className="rounded-lg px-3 py-1.5 text-sm font-bold uppercase tracking-wide"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {label}
        </span>
        <p className="text-[11px] leading-tight text-white/50">
          {BAND_BLURB[band]}
          {res.n_ranked ? (
            <>
              <br />
              <span className="text-white/30">
                {Math.round(pct)}th percentile of {res.n_ranked} tradeable stocks
              </span>
            </>
          ) : null}
        </p>
      </div>

      {/* Position on the scale. Five segments, current one lit. */}
      <div className="mt-4">
        <div className="flex gap-1">
          {BAND_ORDER.map((b) => (
            <div
              key={b}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  b === band ? BAND_COLOR[b] : "rgba(255,255,255,0.07)",
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-white/25">
          <span>Calm</span>
          <span>Wild</span>
        </div>
      </div>

      {hist && (
        <>
          <p className="mt-4 text-[11px] text-white/50">
            Stocks this {label.toLowerCase()} have, over
            the following six months, historically:
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Tile
              label="Swung about"
              value={`${hist.future_vol_ann_pct.toFixed(0)}%`}
              note="a year"
            />
            <Tile
              label="Usual worst dip"
              value={`−${hist.median_max_drawdown_pct.toFixed(0)}%`}
              note="half were worse"
            />
            <Tile
              label="Rough-patch dip"
              value={`−${hist.p90_max_drawdown_pct.toFixed(0)}%`}
              note="1 in 10 were worse"
            />
          </div>
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/30">
        {row.sigma_63_ann_pct != null && (
          <span>Its own swing: {row.sigma_63_ann_pct.toFixed(0)}%/yr</span>
        )}
        {row.beta != null && <span>Beta {row.beta.toFixed(2)}</span>}
        {ago && <span>Measured {ago}</span>}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-white/30">
        {res.calibration
          ? `Measured on ${res.calibration.n_observations.toLocaleString()} past checks across ${res.calibration.n_symbols} EGX stocks. `
          : ""}
        These are past outcomes for stocks that moved like this one — not a
        promise about this one, and nothing here says whether the price goes up
        or down.
      </p>
    </>
  );
}

/**
 * A symbol that exists in the snapshot but earned no rank — it failed the
 * tradeable gate (under 1M EGP/day, or absent from too many sessions).
 *
 * It deliberately shows the raw measurement and NO band. Ranking a stock nobody
 * can enter or exit against names that trade would produce a percentile that
 * means nothing, and this market has plenty of them: MEGM has been frozen with
 * zero volume since January 2022.
 */
function Ungraded({ row }: { row: RiskRow }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] font-medium text-white/60">
        Too thinly traded to grade
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-white/35">
        This stock does not trade often or heavily enough to compare fairly
        against the rest of the market, so it gets no grade rather than a
        misleading one. Thin stocks are also the hardest to sell when you want
        to.
      </p>
      {row.sigma_63_ann_pct != null && (
        <p className="mt-2 font-mono text-[11px] text-white/50">
          Its own recent swing: {row.sigma_63_ann_pct.toFixed(0)}%/yr
        </p>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <p className="text-[9px] leading-tight text-white/40">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[9px] leading-tight text-white/30">{note}</p>
    </div>
  );
}
