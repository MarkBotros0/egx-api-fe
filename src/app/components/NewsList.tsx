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

function NewsItemRow({ item }: { item: NewsItem }) {
  return (
    // Deliberately no gain/loss colour anywhere in here. Those mean a real
    // direction in the data; a headline carries none, and tinting one green
    // would claim a sentiment the app has not computed.
    <li className="rounded-lg border border-white/5 bg-charcoal p-3">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[44px] items-start gap-2 text-sm leading-snug text-white/90 hover:text-white"
      >
        <span className="flex-1">{item.title}</span>
        {/* The story lives on TradingView, not here. Say so rather than
            letting a tap silently leave the app. */}
        <svg
          className="mt-0.5 h-3.5 w-3.5 flex-none text-white/30"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          aria-label="Opens on tradingview.com"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6" />
          <path d="M10 14 21 3" />
        </svg>
      </a>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-[11px] text-white/40">
        {item.provider && <span className="uppercase tracking-wide">{item.provider}</span>}
        <span aria-hidden>·</span>
        <time dateTime={item.published_at}>{relativeAge(item.published_at)}</time>
        {item.symbols.map((s) => (
          <Link
            key={s}
            href={`/stock/${s}`}
            className="inline-flex min-h-[44px] items-center rounded bg-white/5 px-3 font-mono text-xs text-white/60 hover:text-white"
          >
            {s}
          </Link>
        ))}
      </div>
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
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <span className="text-xs text-white/40">
          {items.length} {items.length === 1 ? "story" : "stories"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-white/5 bg-charcoal p-4 text-sm text-white/50">
          {emptyNote}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <NewsItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
