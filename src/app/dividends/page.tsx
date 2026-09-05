"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchDividendCalendar } from "../lib/api";
import type { DividendCalendarResponse, DividendCalendarStock } from "../lib/types";

/**
 * The EGX dividend calendar — every payer's MOST RECENT coupon, grouped by month.
 *
 * Mobile-first agenda, not a grid: a month grid is unreadable on a phone. These
 * are LAST-PAID dates (the honest data we have); the EGX publishes no forward
 * calendar, so "expected next" is only an estimate from last year, said plainly
 * in the banner and per row. Nothing here is gain/loss coloured — an amount and
 * a yield carry no direction.
 */

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayMonth(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_ABBR[parseInt(m[2], 10)]}`;
}

/** Group by "YYYY-MM" of the ex-date, newest first, so the agenda reads as a
 *  reverse-chronological "who paid when". */
function groupByMonth(stocks: DividendCalendarStock[]) {
  const groups = new Map<string, DividendCalendarStock[]>();
  for (const s of stocks) {
    const key = s.ex_date.slice(0, 7); // YYYY-MM
    const bucket = groups.get(key);
    if (bucket) bucket.push(s);
    else groups.set(key, [s]);
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => {
      const [y, m] = key.split("-");
      return { key, label: `${MONTHS[parseInt(m, 10)]} ${y}`, items };
    });
}

function Row({ s }: { s: DividendCalendarStock }) {
  const showName = s.name && s.name.toUpperCase() !== s.symbol.toUpperCase();
  // Expected-next: same month next year, from the last ex-date. An estimate,
  // labelled as one — the EGX sets no forward date.
  const mo = parseInt(s.ex_date.slice(5, 7), 10);
  const nextYear = parseInt(s.ex_date.slice(0, 4), 10) + 1;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <Link
        href={`/stock/${s.symbol}`}
        className="inline-flex h-9 flex-none items-center rounded-lg bg-accent/10 px-2.5 font-mono text-xs font-medium text-accent/90 transition-colors hover:bg-accent/20 hover:text-accent"
      >
        {s.symbol}
      </Link>
      <div className="min-w-0 flex-1">
        {showName && (
          <p className="truncate text-[13px] text-white/70">{s.name}</p>
        )}
        <p className="text-[11px] text-white/40">
          ex-date {dayMonth(s.ex_date)}
          <span className="text-white/25"> · est. next ~{MONTHS_ABBR[mo]} {nextYear}</span>
        </p>
      </div>
      <div className="flex-none text-right">
        <p className="font-mono text-sm font-semibold text-white/90">
          {s.amount != null ? s.amount.toFixed(2) : "—"}
          <span className="ml-1 text-[10px] font-normal text-white/40">EGP</span>
        </p>
        {s.dividend_yield != null && s.dividend_yield > 0 && (
          <p className="font-mono text-[11px] text-white/45">{s.dividend_yield.toFixed(1)}%</p>
        )}
      </div>
    </li>
  );
}

export default function DividendCalendarPage() {
  const [data, setData] = useState<DividendCalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchDividendCalendar()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const groups = useMemo(
    () => (data ? groupByMonth(data.stocks) : []),
    [data]
  );

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">Dividend calendar</h1>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-white/70">The dividend calendar didn&apos;t load.</p>
          <p className="mt-1 text-xs text-white/40">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null; // loading.tsx owns this frame

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dividend calendar</h1>
        <p className="mt-1 text-xs text-white/40">
          {data.count} EGX {data.count === 1 ? "stock" : "stocks"} with a dividend on record
        </p>
      </header>

      {/* The honesty banner — these are LAST-PAID dates, not a forward schedule. */}
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
        <p className="text-[13px] leading-relaxed text-white/60">
          These are the most recent coupons on record. The EGX publishes no forward
          calendar, so an &ldquo;expected next&rdquo; date is only an estimate from last
          year — most EGX companies pay once, around April–May, after results.
        </p>
      </div>

      {data.count === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/50">
          No dividend dates on record yet — the nightly fundamentals job fills this in.
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="mb-6">
            <div className="mb-2 flex items-baseline gap-2.5">
              <h2 className="text-base font-semibold tracking-tight text-white">{g.label}</h2>
              <span className="font-mono text-xs text-white/35">{g.items.length}</span>
            </div>
            <ul className="space-y-2">
              {g.items.map((s) => (
                <Row key={s.symbol} s={s} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
