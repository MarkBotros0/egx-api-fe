"use client";

import Link from "next/link";
import type { Signal } from "@/app/lib/types";

/**
 * The signals list, behind ONE tap.
 *
 * A ten-holding portfolio routinely produces twenty-odd signals, which on a
 * phone is several screens of scrolling between the holdings above and the
 * risk metrics below. It collapses the same way `RealizedSection` does — a
 * `<details>` rather than useState, so it renders collapsed on the server and
 * never flashes open before hydration, and the state is deliberately not
 * persisted.
 *
 * **The count line is what makes collapsing safe.** An `action_required`
 * signal is the loudest thing this panel has, and hiding it behind a tap with
 * nothing on screen to say it is there would lose it. The header carries a
 * pill per severity in that severity's own colour, so "2 urgent" is visible
 * closed — the same trade `RealizedSection` makes by keeping its headline
 * figure in the summary.
 */

interface AdvicePanelProps {
  signals: Signal[];
}

const SEVERITY_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    icon: string;
    iconBg: string;
    /** [singular, plural] — what the collapsed header calls this tier. */
    label: [string, string];
  }
> = {
  action_required: {
    bg: "bg-loss/10",
    border: "border-loss/30",
    icon: "!!",
    iconBg: "bg-loss/30 text-loss",
    label: ["urgent", "urgent"],
  },
  warning: {
    bg: "bg-loss/5",
    border: "border-loss/20",
    icon: "!",
    iconBg: "bg-loss/20 text-loss",
    label: ["warning", "warnings"],
  },
  opportunity: {
    bg: "bg-gain/5",
    border: "border-gain/20",
    icon: "$",
    iconBg: "bg-gain/20 text-gain",
    label: ["opportunity", "opportunities"],
  },
  info: {
    bg: "bg-accent/5",
    border: "border-accent/20",
    icon: "i",
    iconBg: "bg-accent/20 text-accent",
    label: ["note", "notes"],
  },
};

/** Loudest first — the same order the backend sorts the list in. */
const SEVERITY_ORDER = [
  "action_required",
  "warning",
  "opportunity",
  "info",
] as const;

export default function AdvicePanel({ signals }: AdvicePanelProps) {
  if (!signals.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/40">No signals or advice to show.</p>
      </div>
    );
  }

  // An unrecognised severity falls into `info`, exactly as the body's
  // `|| SEVERITY_STYLES.info` does — so the pills always sum to the total.
  const tierOf = (signal: Signal) =>
    signal.severity in SEVERITY_STYLES ? signal.severity : "info";

  const counts = SEVERITY_ORDER.map((severity) => ({
    severity,
    style: SEVERITY_STYLES[severity],
    count: signals.filter((s) => tierOf(s) === severity).length,
  })).filter((tier) => tier.count > 0);

  return (
    <details className="group rounded-xl border border-white/5 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-white/70">
            Signals &amp; Advice
            <span className="ml-2 text-white/30">{signals.length}</span>
          </h3>
          {/* Visible while collapsed — see the header comment. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {counts.map((tier) => (
              <span
                key={tier.severity}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tier.style.iconBg}`}
              >
                {tier.count}{" "}
                {tier.style.label[tier.count === 1 ? 0 : 1]}
              </span>
            ))}
          </div>
        </div>
        {/* The only affordance that this opens — list-none removes the default
            marker and a phone has no hover state to reveal one. */}
        <svg
          className="h-5 w-5 shrink-0 text-white/30 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>

      <div className="space-y-3 px-4 pb-4">
        {signals.map((signal, i) => {
          const style = SEVERITY_STYLES[signal.severity] || SEVERITY_STYLES.info;
          return (
            <div
              key={i}
              className={`rounded-xl border ${style.border} ${style.bg} p-4`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.iconBg}`}
                >
                  {style.icon}
                </div>
                <div>
                  <p className="text-sm text-white/90">{signal.message}</p>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">
                    {signal.explanation}
                  </p>
                  {signal.learn_concept && (
                    <Link
                      href={`/learn#${signal.learn_concept}`}
                      className="mt-1.5 inline-block text-[11px] text-accent/70 hover:text-accent"
                    >
                      Learn more →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <p className="mt-4 rounded-lg bg-white/[0.02] p-3 text-[10px] text-white/30">
          This is educational analysis for learning purposes only, not financial
          advice. Always do your own research before making investment
          decisions.
        </p>
      </div>
    </details>
  );
}
