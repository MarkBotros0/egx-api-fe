"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchDividendCalendar } from "../lib/api";
import type { DividendCalendarResponse, DividendCalendarStock } from "../lib/types";

/**
 * The EGX dividend calendar — a month grid you page through by year and month,
 * with the selected day's payers listed beneath it.
 *
 * These are LAST-PAID ex-dates (the honest data we have); the EGX publishes no
 * forward calendar, so the banner says so. Nothing here is gain/loss coloured —
 * an amount and a yield carry no direction.
 */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]; // Sunday-first, EGX-appropriate

/** Weekday index (0=Sun) of the 1st of a month, timezone-safe via UTC. */
function firstWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export default function DividendCalendarPage() {
  const [data, setData] = useState<DividendCalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // ISO or null = whole month

  useEffect(() => {
    let alive = true;
    fetchDividendCalendar()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // Index ex-dates -> stocks, and collect the years present for the selector.
  const { byDate, years, latest } = useMemo(() => {
    const byDate = new Map<string, DividendCalendarStock[]>();
    const yearSet = new Set<number>();
    let latest = "";
    for (const s of data?.stocks ?? []) {
      const bucket = byDate.get(s.ex_date);
      if (bucket) bucket.push(s);
      else byDate.set(s.ex_date, [s]);
      yearSet.add(parseInt(s.ex_date.slice(0, 4), 10));
      if (s.ex_date > latest) latest = s.ex_date;
    }
    return { byDate, years: Array.from(yearSet).sort((a, b) => b - a), latest };
  }, [data]);

  // Default the view to the most recent month that has data.
  useEffect(() => {
    if (!view && latest) {
      setView({ y: parseInt(latest.slice(0, 4), 10), m: parseInt(latest.slice(5, 7), 10) - 1 });
    }
  }, [latest, view]);

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

  if (!data || !view) return null; // loading.tsx owns this frame

  const { y, m } = view;
  const shift = (delta: number) => {
    const d = new Date(Date.UTC(y, m + delta, 1));
    setView({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    setSelectedDay(null);
  };
  const iso = (day: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const lead = firstWeekday(y, m);
  const total = daysInMonth(y, m);
  const cells: (number | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  // What to list under the grid: the selected day, else the whole month.
  const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;
  const listed: DividendCalendarStock[] = selectedDay
    ? byDate.get(selectedDay) ?? []
    : (data.stocks ?? [])
        .filter((s) => s.ex_date.startsWith(monthPrefix))
        .sort((a, b) => b.ex_date.localeCompare(a.ex_date));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dividend calendar</h1>
        <p className="mt-1 text-xs text-white/40">
          {data.count} EGX {data.count === 1 ? "stock" : "stocks"} with a dividend on record
        </p>
      </header>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
        <p className="text-[13px] leading-relaxed text-white/60">
          These are the most recent coupons on record — their ex-dates (own the
          share before it to get the coupon). The EGX publishes no forward
          calendar, so future dates aren&apos;t shown; most companies pay once,
          around April–May.
        </p>
      </div>

      {/* Year + month selectors, and prev/next paging. */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-accent/30 hover:text-accent"
        >
          ‹
        </button>
        <select
          value={m}
          onChange={(e) => { setView({ y, m: parseInt(e.target.value, 10) }); setSelectedDay(null); }}
          className="min-h-[36px] flex-1 rounded-lg border border-white/10 bg-charcoal px-3 text-sm text-white/80"
          aria-label="Month"
        >
          {MONTHS.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
        <select
          value={y}
          onChange={(e) => { setView({ y: parseInt(e.target.value, 10), m }); setSelectedDay(null); }}
          className="min-h-[36px] rounded-lg border border-white/10 bg-charcoal px-3 text-sm text-white/80"
          aria-label="Year"
        >
          {/* Years present in the data; guarantee the viewed year is selectable. */}
          {(years.includes(y) ? years : [y, ...years]).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-accent/30 hover:text-accent"
        >
          ›
        </button>
      </div>

      {/* The month grid. A day with ex-dividends shows a dot + count and is
          tappable to filter the list below to that day. */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2 md:p-3">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-white/30">
              {w}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`x${i}`} />;
            const d = iso(day);
            const hits = byDate.get(d);
            const isSelected = selectedDay === d;
            return (
              <button
                key={d}
                type="button"
                disabled={!hits}
                onClick={() => setSelectedDay(isSelected ? null : d)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                  isSelected
                    ? "bg-accent/20 text-accent"
                    : hits
                      ? "bg-white/[0.06] text-white/80 hover:bg-white/10"
                      : "text-white/25"
                }`}
              >
                <span>{day}</span>
                {hits && (
                  <span className="mt-0.5 font-mono text-[9px] text-accent/80">{hits.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The list beneath the grid. */}
      <div className="mb-2 mt-5 flex items-baseline gap-2.5">
        <h2 className="text-base font-semibold tracking-tight text-white">
          {selectedDay
            ? `${parseInt(selectedDay.slice(8, 10), 10)} ${MONTHS_ABBR[m]} ${y}`
            : `${MONTHS[m]} ${y}`}
        </h2>
        <span className="font-mono text-xs text-white/35">{listed.length}</span>
        {selectedDay && (
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="ml-auto text-[11px] text-accent/70 hover:text-accent"
          >
            Show whole month
          </button>
        )}
      </div>

      {listed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm text-white/50">
          No dividends on record for {MONTHS[m]} {y}.
        </p>
      ) : (
        <ul className="space-y-2">
          {listed.map((s) => (
            <li key={s.symbol + s.ex_date} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
              <Link
                href={`/stock/${s.symbol}`}
                className="inline-flex h-9 flex-none items-center rounded-lg bg-accent/10 px-2.5 font-mono text-xs font-medium text-accent/90 transition-colors hover:bg-accent/20 hover:text-accent"
              >
                {s.symbol}
              </Link>
              <div className="min-w-0 flex-1">
                {s.name && s.name.toUpperCase() !== s.symbol.toUpperCase() && (
                  <p className="truncate text-[13px] text-white/70">{s.name}</p>
                )}
                <p className="text-[11px] text-white/40">
                  ex-date {parseInt(s.ex_date.slice(8, 10), 10)} {MONTHS_ABBR[parseInt(s.ex_date.slice(5, 7), 10) - 1]} {s.ex_date.slice(0, 4)}
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
          ))}
        </ul>
      )}
    </div>
  );
}
