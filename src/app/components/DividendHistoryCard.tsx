"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LearnTooltip from "./LearnTooltip";
import { fetchDividendHistory } from "../lib/api";
import type { DividendHistoryResponse } from "../lib/types";

/**
 * Dated, multi-year dividend history for one stock, plus an estimated-next line.
 *
 * SELF-FETCHING by symbol (the RiskGradeCard precedent) rather than riding on
 * AnalysisResponse: the source is Yahoo, independent of the scoring pipeline, so
 * a slow or absent dividend fetch must not hold up — or fail — the rest of the
 * page. Degrades to an empty state, never an error wall.
 *
 * No gain/loss colour anywhere: a dividend paid is not a "loss", and the amount
 * carries no direction. (House rule, repeated across the app.)
 */

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-04-07" -> "7 Apr". Purely for display; the year is shown separately. */
function dayMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10)]}`;
}

const SHELL = "rounded-xl border border-white/5 bg-white/[0.02] p-4 md:p-5";

function Header() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-medium text-white/70">
        <LearnTooltip
          term="Dividend History"
          explanation="The cash coupons this company has paid shareholders, per share, over the years — with the ex-date (own the share before it to receive that coupon). Amounts are gross, as reported; Egypt's 5-10% withholding comes off before the cash reaches you. The EGX publishes no forward calendar, so any 'expected' date here is only an estimate from past years, never a promise."
        >
          <span>Dividend History</span>
        </LearnTooltip>
      </h3>
      <Link
        href="/learn#dividend_dates"
        className="text-[11px] text-accent/70 transition-colors hover:text-accent"
      >
        Learn more →
      </Link>
    </div>
  );
}

function EmptyState({ note }: { note: string }) {
  return (
    <div className={SHELL}>
      <Header />
      <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center">
        <p className="text-xs text-white/50">{note}</p>
      </div>
    </div>
  );
}

const PAGE = 8; // years shown before "Show more"

export default function DividendHistoryCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<DividendHistoryResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [shownCount, setShownCount] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    setShownCount(PAGE); // reset pagination when the symbol changes
    fetchDividendHistory(symbol)
      .then((d) => alive && setData(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [symbol]);

  // In-flight: a light skeleton so the card's slot doesn't jump when it lands.
  if (!data && !failed) {
    return (
      <div className={SHELL}>
        <Header />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/5" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-3/5 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (failed || !data || data.status === "unavailable") {
    return <EmptyState note="Dividend history is unavailable right now." />;
  }

  const { dividends, cadence } = data;
  if (dividends.length === 0) {
    return <EmptyState note="No dividend history on record for this stock." />;
  }

  const shown = dividends.slice(0, shownCount);
  const remaining = dividends.length - shown.length;
  const fullyExpanded = shownCount >= dividends.length;

  return (
    <div className={SHELL}>
      <Header />

      <ul className="space-y-1.5">
        {shown.map((d) => (
          <li
            key={`${d.ex_date}-${d.amount}`}
            className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] pb-1.5 last:border-0"
          >
            <span className="font-mono text-xs text-white/40">{d.year}</span>
            <span className="flex-1 text-right font-mono text-sm font-semibold text-white/90">
              {d.amount.toFixed(2)}
              <span className="ml-1 text-[10px] font-normal text-white/40">EGP</span>
            </span>
            <span className="w-16 text-right font-mono text-[11px] text-white/50">
              {dayMonth(d.ex_date)}
            </span>
          </li>
        ))}
      </ul>

      {/* Paginate through ALL years, not just a fixed slice. Show more reveals
          the next page; once fully expanded, Show less collapses it back. */}
      {dividends.length > PAGE && (
        <button
          type="button"
          onClick={() =>
            setShownCount(fullyExpanded ? PAGE : Math.min(shownCount + PAGE, dividends.length))
          }
          className="mt-2.5 min-h-[36px] w-full rounded-lg border border-white/10 text-[11px] font-medium text-white/50 transition-colors hover:border-accent/30 hover:text-accent"
        >
          {fullyExpanded
            ? "Show less"
            : `Show ${Math.min(PAGE, remaining)} more — ${remaining} earlier`}
        </button>
      )}

      {/* The estimate — clearly the PAST pattern, not a forward promise. */}
      {cadence.typical_month_name && (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-white/45">
          Typically pays around{" "}
          <span className="text-white/70">{cadence.typical_month_name}</span>
          {cadence.payments_per_year && cadence.payments_per_year > 1
            ? ` · ${cadence.payments_per_year}× a year`
            : ""}
          {cadence.last_ex_date ? ` · last ex-date ${dayMonth(cadence.last_ex_date)} ${cadence.last_ex_date.slice(0, 4)}` : ""}
          . <span className="text-white/30">Estimated from past years — the EGX sets no forward date.</span>
        </p>
      )}
    </div>
  );
}
