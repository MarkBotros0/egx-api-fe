"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { fetchCalibration, type CalibrationResponse } from "@/app/lib/api";

/**
 * "Checking our work" — the app's own accuracy record.
 *
 * Almost no retail finance product shows the person relying on a number how
 * often that number was right. FiveThirtyEight's version is the canonical
 * public example and it no longer exists.
 *
 * Two rules this page exists under:
 *
 *  1. COVERAGE ALONE IS GAMEABLE. A band from zero to infinity contains every
 *     outcome. So the width of the band ships beside the hit rate, and the
 *     headline admits it is wide.
 *  2. THE FAILURES ARE ON THE SAME PAGE AS THE SUCCESSES. A record that only
 *     lists what worked is marketing. Everything the app tested and dropped is
 *     listed, including the claim it published for months and had to retract.
 */

export default function CalibrationPage() {
  const [data, setData] = useState<CalibrationResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCalibration()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-white/40">
          Could not load the accuracy record.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-40 animate-pulse rounded bg-white/5" />
      </main>
    );
  }

  const { forecast, risk_grade, what_failed } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <h1 className="text-xl font-bold text-white">Checking our work</h1>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        When this app says a range holds 9 times in 10, did it? Every number
        below was measured on{" "}
        <span className="font-mono text-white/80">
          {forecast.n_observations.toLocaleString()}
        </span>{" "}
        past checks against real Egyptian market history, and every one of them
        is re-runnable.
      </p>

      <section className="mt-6 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">
          Ranges: what we promised vs what happened
        </h2>
        <div className="mt-3 space-y-2">
          {forecast.bands.map((b) => {
            const gap = b.delivered_pct - b.promised_pct;
            const close = Math.abs(gap) <= 2;
            return (
              <div key={b.claim} className="rounded-lg bg-white/[0.03] p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs text-white/70">{b.claim}</span>
                  <span className="shrink-0 font-mono text-xs">
                    <span className="text-white/40">
                      said {b.promised_pct}%
                    </span>
                    <span className="mx-1.5 text-white/25">→</span>
                    <span className={close ? "text-white" : "text-white/70"}>
                      was {b.delivered_pct}%
                    </span>
                  </span>
                </div>
                {b.note && (
                  <p className="mt-1 text-[10px] leading-relaxed text-white/30">
                    {b.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
          <p className="text-[11px] font-medium text-white/60">
            How wide is that range?{" "}
            <span className="font-mono text-white/80">
              {forecast.sharpness.median_width_pct_of_spot}% of the share price
            </span>
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-white/35">
            {forecast.sharpness.note} Half the time the 3-month range is wider
            than {forecast.sharpness.p25}% and narrower than{" "}
            {forecast.sharpness.p75}% of today&apos;s price. That is a wide
            range, and it is meant to be — the market genuinely is that
            uncertain over three months.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">
          Risk grade: how well it ordered stocks
        </h2>
        <div className="mt-3 space-y-2">
          {risk_grade.claims.map((c) => (
            <div
              key={c.claim}
              className="flex items-baseline justify-between gap-3 rounded-lg bg-white/[0.03] p-3"
            >
              <span className="text-xs text-white/70">{c.claim}</span>
              <span className="shrink-0 font-mono text-xs text-white/80">
                {c.ic.toFixed(2)}{" "}
                <span className="text-white/35">(t {c.t_non_overlapping})</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-white/30">
          A correlation of 0.03–0.05 counts as good in professional investing.
          These are far higher because how much a stock moves is genuinely
          predictable — unlike which way it moves.
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-loss/10 bg-loss/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">
          What we tested and dropped
        </h2>
        <p className="mt-1 text-[11px] text-white/45">
          A record that only lists what worked is marketing.
        </p>
        <div className="mt-3 space-y-3">
          {what_failed.map((f) => (
            <div key={f.claim} className="rounded-lg bg-white/[0.03] p-3">
              <p className="text-xs font-medium text-white/70">{f.claim}</p>
              <p className="mt-1 font-mono text-[10px] text-white/40">
                {f.measured}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">
                {f.outcome}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-6 text-[10px] leading-relaxed text-white/25">
        Measured {forecast.fitted_at} on {forecast.universe}.{" "}
        <Link href="/learn#risk-management" className="text-accent/60">
          Learn how to read these →
        </Link>
      </p>
    </main>
  );
}
