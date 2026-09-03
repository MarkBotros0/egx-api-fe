"use client";

import Link from "next/link";
import type { NewsItem } from "../lib/types";

/**
 * "3d ago" / "21d ago". Every item states its real age.
 *
 * A headline with no time context is not acceptable on this surface: the feed
 * is filtered to 30 days, but 3 days old and 29 days old are different facts
 * and the reader is entitled to both.
 *
 * Call this on the client only — it reads `new Date()`, so server-rendering an
 * item and hydrating across an hour boundary would mismatch.
 */
export function relativeAge(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const hours = Math.floor((now.getTime() - then) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Under a day old — the feed's freshness signal. Client-only, same as relativeAge. */
function isFresh(iso: string, now: Date = new Date()): boolean {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  return now.getTime() - then < 24 * 3_600_000;
}

// A handful of sources come through the feed as lowercase slugs. These render
// as an acronym rather than a title-cased word, because that IS how the source
// is known ("LSE", not "Lse"). Everything else is title-cased from its slug.
const _ACRONYMS = new Set(["lse", "sec", "imf", "gdr", "pr"]);

/** "dow-jones" -> "Dow Jones", "lse" -> "LSE", "reuters" -> "Reuters". */
function sourceName(provider: string | null): string {
  if (!provider) return "Wire";
  return provider
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (_ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * A small monogram anchors each story to its source without a logo asset
 * (external images are CSP/CORS-blocked here). It is deliberately monochrome —
 * a rainbow of per-source colours would read as decoration, and any green/red
 * would collide with the one meaning colour carries in this app. The letter
 * does the distinguishing.
 */
function SourceMark({ provider }: { provider: string | null }) {
  const initial = sourceName(provider).charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/[0.06] font-mono text-[11px] font-semibold text-white/70 ring-1 ring-inset ring-white/10"
    >
      {initial}
    </span>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const fresh = isFresh(item.published_at);

  return (
    // Matches the dashboard StockCard's quality tier — real surface, a border
    // that answers hover, a lift on interaction — rather than the flat panel
    // this used to be. No gain/loss colour anywhere: those mean a direction in
    // the data, and a headline carries none.
    <li className="group rounded-xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-white/10 hover:bg-white/[0.06]">
      {/* Source line: who said it, and how fresh. The organizing facts of a
          news feed, so they lead. */}
      <div className="flex items-center gap-2.5">
        <SourceMark provider={item.provider} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/70">
          {sourceName(item.provider)}
        </span>
        <span className="flex flex-none items-center gap-1.5">
          {fresh && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-accent"
              title="Published in the last 24 hours"
            />
          )}
          <time
            dateTime={item.published_at}
            className="font-mono text-[11px] text-white/40"
          >
            {relativeAge(item.published_at)}
          </time>
        </span>
      </div>

      {/* The headline is the hero of the card and the link to the story. The
          story lives on TradingView, so it opens off-app with a marker rather
          than leaving silently. */}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex min-h-[44px] items-start gap-2 text-[15px] font-semibold leading-snug text-white/95 transition-colors hover:text-white"
      >
        <span className="flex-1">{item.title}</span>
        <svg
          className="mt-1 h-3.5 w-3.5 flex-none text-white/25 transition-colors group-hover:text-white/50"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          aria-label="Opens on tradingview.com"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
        </svg>
      </a>

      {/* Tickers this story touches, each a route to that stock. Accent-tinted
          because they are the interactive, in-app element on an otherwise
          neutral card. Sized to a comfortable tap target with clear separation;
          the headline above is the 44px primary target. */}
      {item.symbols.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.symbols.map((s) => (
            <Link
              key={s}
              href={`/stock/${s}`}
              className="inline-flex h-9 items-center rounded-lg bg-accent/10 px-2.5 font-mono text-xs font-medium text-accent/90 transition-colors hover:bg-accent/20 hover:text-accent"
            >
              {s}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}

export default function NewsList({
  title,
  items,
  emptyNote,
}: {
  title: string;
  items: NewsItem[];
  emptyNote: string;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline gap-2.5">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <span className="font-mono text-xs text-white/35">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-sm leading-relaxed text-white/50">
          {emptyNote}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
