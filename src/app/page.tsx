"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import StockCard, { type CardState } from "./components/StockCard";
import IndexFilter from "./components/IndexFilter";
import MarketRegimeCard from "./components/MarketRegimeCard";
import SectorFilter from "./components/SectorFilter";
import WatchlistPanel, { useWatchlist } from "./components/Watchlist";
import { useTickers } from "./components/TickersProvider";
import { CardSkeleton } from "./components/LoadingSkeleton";
import LearnTooltip from "./components/LearnTooltip";
import { useScoreWeights } from "./components/ScoreWeightsProvider";
import { fetchCompositeBatch, fetchDashboard } from "./lib/api";
import {
  CARDS_PER_PAGE,
  COMPOSITE_MAX_ATTEMPTS,
  COMPOSITE_RETRY_DELAY_MS,
} from "./lib/constants";
import type { Ticker, CompositeSignal } from "./lib/types";

const COMPOSITE_INTERVALS = ["Daily", "Weekly", "Monthly"] as const;
type CompositeInterval = (typeof COMPOSITE_INTERVALS)[number];

const LS_COMPOSITE_ENABLED = "egx-dashboard-composite-enabled";
const LS_COMPOSITE_INTERVAL = "egx-dashboard-composite-interval";

const SORTS = ["Default", "Score", "Change", "Risk"] as const;
type SortKey = (typeof SORTS)[number];

interface CardData {
  price?: number;
  change?: number;
  changePct?: number;
  sparkline?: number[];
  score?: number | null;
  signal?: CompositeSignal | null;
  state: CardState;
  /** Past 63-day volatility, for the Risk sort. Snapshot only. */
  sigma?: number | null;
  /**
   * The Calm..Wild risk band and its label. Snapshot only — the live upgrade
   * rescores the composite but not the cross-sectional risk rank, so these are
   * carried through an upgrade unchanged rather than blanked.
   */
  riskBand?: string | null;
  riskBandLabel?: string | null;
  /**
   * The SESSION this price came from, e.g. "2026-09-02" — per card, never a
   * table-wide figure. Two earlier versions of this label were wrong in
   * different ways: `oldest_measurement` is the stalest row in the WHOLE
   * snapshot (and seed_symbol_health back-dates never-fetched symbols to the
   * epoch, so every card read "as of 1 Jan"), and `measured_at` is our cron's
   * clock rather than the price's, which put "22:33:28" on a 14:30 close.
   */
  barDate?: string | null;
  /**
   * When THIS card's figures were fetched, epoch ms. Two different clocks by
   * design: the snapshot's `measured_at` (our cron, hours ago) or the moment
   * the live upgrade landed in this browser (seconds ago). It answers "how
   * fresh is what I am looking at", which `barDate` cannot — a card can show
   * "Sep 3" all afternoon while the number behind it is an hour old.
   */
  fetchedAt?: number;
}

/**
 * "2026-09-02" -> "2 Sep". The SESSION the price came from, not a clock time.
 *
 * Deliberately date-only. The snapshot's price is a daily CLOSE, struck at the
 * 14:30 Cairo bell; the cron happens to fetch it hours later. Showing that
 * fetch time — "as of 2 Sep, 22:33:28" — read as though the price itself were
 * from 22:33, which is both wrong and precise to the second about a number
 * that only moves once a day.
 */
function sessionLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Is this bar today's session?
 *
 * Decides whether the card may call the price a "close". Today's bar is still
 * moving while the EGX is open (10:00-14:30 Cairo), so labelling it a close
 * would be wrong for four and a half hours every trading day.
 *
 * Compared on the DATE STRING, not by constructing Date objects and comparing
 * instants: `last_bar_date` is a bare "2026-09-03" with no timezone, and
 * `new Date("2026-09-03")` parses as UTC midnight, which is the previous day
 * anywhere west of Greenwich.
 */
function isTodaysSession(barDate: string | null | undefined): boolean {
  if (!barDate) return false;
  const now = new Date();
  const local = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return barDate.slice(0, 10) === local;
}

/**
 * Epoch ms -> "14s ago" / "3m 14s ago" / "18h 22m ago".
 *
 * Seconds only matter while they are small — a live card fetched moments ago is
 * exactly when the reader wants that precision. Past an hour the seconds are
 * noise, so the unit steps up rather than printing "18h 22m 07s".
 */
function agoLabel(at: number | undefined, now: number): string | null {
  if (!at) return null;
  const secs = Math.max(0, Math.round((now - at) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Is the EGX open right now? It trades Sun-Thu, 10:00-14:30 Africa/Cairo.
 *
 * Cairo wall-clock is read through Intl, so this is correct for a user browsing
 * from another timezone and survives Egypt's DST rather than trusting the
 * device clock. When the market is shut a price cannot get newer than the last
 * close, so the card drops its climbing "...ago" for a static "Market closed"
 * (see StockCard) instead of a stamp that grows all weekend and reads as stale.
 */
function isEgxOpen(nowMs: number): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(nowMs));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday"); // "Sun".."Sat"
  if (weekday === "Fri" || weekday === "Sat") return false; // EGX weekend
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some engines emit "24" for midnight
  const minutes = hour * 60 + parseInt(get("minute"), 10);
  return minutes >= 600 && minutes <= 870; // 10:00-14:30 Cairo
}

export default function Dashboard() {
  const { tickers, loading } = useTickers();
  const [index, setIndex] = useState("EGX30");
  const [sector, setSector] = useState("All Sectors");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("Default");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showComposite, setShowComposite] = useState(true);
  const [compositeInterval, setCompositeInterval] =
    useState<CompositeInterval>("Daily");
  const [showNoFeed, setShowNoFeed] = useState(false);

  // Drives the "14s ago" labels. One timer for the whole grid rather than one
  // per card, and PAUSED while the tab is hidden — a phone in a pocket should
  // not re-render 24 cards a second. Resyncs on wake so the first paint after
  // returning is correct rather than however stale the last tick left it.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      setNow(Date.now());
      id ??= setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    const onVisibility = () =>
      document.visibilityState === "visible" ? start() : stop();
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Hydrate the on/off toggle from localStorage (client-only).
  //
  // The INTERVAL is deliberately NOT restored. It used to be, which meant one
  // tap on "Monthly" stuck permanently: every later visit reopened on Monthly,
  // and the cards linked to stock pages with ?interval=Monthly, so the whole
  // app silently sat on the least reliable timeframe. Daily is the view every
  // entry zone, stop-loss and portfolio signal is built on, so each session
  // now starts there and switching is an explicit, per-session choice.
  useEffect(() => {
    const enabled = window.localStorage.getItem(LS_COMPOSITE_ENABLED);
    if (enabled === "false") setShowComposite(false);
    // Clear the old preference so it stops lingering in existing browsers.
    window.localStorage.removeItem(LS_COMPOSITE_INTERVAL);
  }, []);

  // ONE map, symbol -> everything a card draws. Price and score used to live in
  // two separate maps filled by two different code paths, which is part of how
  // a card could end up holding a price with no score, or the reverse.
  const [cards, setCards] = useState<Record<string, CardData>>({});
  const [snapshotLoaded, setSnapshotLoaded] = useState(false);
  /** Symbols the snapshot says the feed does not serve. Never requested live. */
  const [noFeed, setNoFeed] = useState<Set<string>>(new Set());

  const inFlightRef = useRef<Set<string>>(new Set());
  const attemptsRef = useRef<Map<string, number>>(new Map());
  const runIdRef = useRef(0);
  /**
   * Symbols already upgraded to live figures in the CURRENT run.
   *
   * A ref, not `cards[sym].state === "live"`, and that is the whole fix for a
   * dead Refresh button. Refs mutate synchronously; state does not. The reset
   * effect below only SCHEDULES the demotion of live cards back to stale, so
   * the upgrade effect — which runs in the same commit, right after it — still
   * saw every symbol as "live", filtered them all out, and returned having
   * done nothing. Its deps had already changed, so it never ran again.
   */
  const upgradedRef = useRef<Set<string>>(new Set());
  const { version: weightsVersion } = useScoreWeights();
  const { symbols: watchlistSymbols } = useWatchlist();

  // ---------------------------------------------------------------------
  // Step 1 — the snapshot. One request, whole universe, no upstream fetch.
  //
  // This replaced a dozen concurrent /api/analysis?mode=batch calls. Those
  // needed a live 400-bar pull per symbol through a client that retries hard
  // on socket timeouts, and Vercel answered them from a dozen separate
  // containers with a dozen empty caches, each re-fetching the same benchmark.
  // Whether a card painted came down to which container answered.
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    // refreshKey > 0 means the user pressed Refresh, so bypass the service
    // worker's stale-while-revalidate copy and go to the network.
    fetchDashboard({ fresh: refreshKey > 0 })
      .then((res) => {
        if (cancelled) return;
        const next: Record<string, CardData> = {};
        const dead = new Set<string>();
        for (const row of res.rows) {
          const sym = row.symbol.toUpperCase();
          if (!row.available) dead.add(sym);
          next[sym] = {
            price: row.price ?? undefined,
            change: row.change ?? undefined,
            changePct: row.change_pct ?? undefined,
            sparkline: row.sparkline,
            score: row.score,
            signal: row.signal,
            sigma: row.sigma_63_ann_pct,
            riskBand: row.risk_band,
            riskBandLabel: row.risk_band_label,
            barDate: row.last_bar_date,
            fetchedAt: row.measured_at ? Date.parse(row.measured_at) : undefined,
            state: row.available ? "stale" : "unavailable",
          };
        }
        // Merge rather than replace: a live upgrade may already have landed
        // for a symbol, and it must not be pushed back to a stale value.
        setCards((prev) => {
          const merged = { ...next };
          for (const [sym, existing] of Object.entries(prev)) {
            if (existing.state === "live") merged[sym] = existing;
          }
          return merged;
        });
        setNoFeed(dead);
        // `res.oldest_measurement` is deliberately NOT surfaced. It is the
        // stalest row in the whole table and seed_symbol_health back-dates
        // never-fetched symbols to the epoch, so it is a diagnostic for the
        // scheduler, not a date to show a reader. Each card states its own.
      })
      .catch(() => {
        // The snapshot is an accelerator, not a dependency. If it fails — or
        // the scheduled job has never run — the live path below still fills
        // the grid exactly as it did before this existed.
      })
      .finally(() => {
        if (!cancelled) setSnapshotLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [weightsVersion, refreshKey]);

  // Filter & search
  const filtered = useMemo(() => {
    let result = tickers;

    if (index !== "All") {
      result = result.filter((t) => t.index === index);
    }
    if (sector !== "All Sectors") {
      result = result.filter((t) => t.sector === sector);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [tickers, index, sector, search]);

  // Stocks the feed does not serve are moved out of the grid, not hidden. They
  // are real listings and the count stays truthful; they simply stop occupying
  // the top of the page with cards that were never going to fill.
  const { quoted, unquoted } = useMemo(() => {
    const q: Ticker[] = [];
    const u: Ticker[] = [];
    for (const t of filtered) {
      (noFeed.has(t.symbol.toUpperCase()) ? u : q).push(t);
    }
    return { quoted: q, unquoted: u };
  }, [filtered, noFeed]);

  // Sorting is possible only because the snapshot delivers the WHOLE universe
  // in one payload. While cards were fetched a page at a time, off-screen
  // stocks had no score to sort by, so this control could not exist.
  const sorted = useMemo(() => {
    if (sort === "Default") return quoted;
    const val = (t: Ticker) => {
      const c = cards[t.symbol.toUpperCase()];
      if (!c) return null;
      if (sort === "Score") return c.score ?? null;
      if (sort === "Change") return c.changePct ?? null;
      return c.sigma ?? null; // Risk: calmest first.
    };
    const dir = sort === "Risk" ? 1 : -1;
    return [...quoted].sort((a, b) => {
      const av = val(a);
      const bv = val(b);
      // Unmeasured stocks sink, whichever direction the sort runs. Treating a
      // missing value as zero would rank them as the worst stocks on the
      // exchange rather than as ones we have no reading for.
      if (av === null && bv === null) return a.symbol.localeCompare(b.symbol);
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av - bv) * dir;
    });
  }, [quoted, cards, sort]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [index, sector, search, sort]);

  const visible = sorted.slice(0, page * CARDS_PER_PAGE);
  const hasMore = visible.length < sorted.length;

  const toggleComposite = () => {
    setShowComposite((prev) => {
      const next = !prev;
      window.localStorage.setItem(LS_COMPOSITE_ENABLED, next ? "true" : "false");
      return next;
    });
  };

  // Not persisted — see the mount effect above. Resets to Daily next visit.
  const pickInterval = (iv: CompositeInterval) => {
    setCompositeInterval(iv);
  };

  // Weights and interval change what a score MEANS, so live values are demoted
  // back to stale rather than dropped. The grid is never emptied: the snapshot
  // effect re-runs on weightsVersion and repaints with re-blended scores.
  useEffect(() => {
    runIdRef.current += 1;
    inFlightRef.current = new Set();
    attemptsRef.current = new Map();
    // Synchronous, so the upgrade effect below sees the cleared set in this
    // same commit. The setCards demotion under it is not — see upgradedRef.
    upgradedRef.current = new Set();
    setCards((prev) => {
      const next: Record<string, CardData> = {};
      for (const [sym, c] of Object.entries(prev)) {
        next[sym] = c.state === "live" ? { ...c, state: "stale" } : c;
      }
      return next;
    });
  }, [weightsVersion, refreshKey, compositeInterval]);

  // ---------------------------------------------------------------------
  // Step 2 — upgrade the VISIBLE page to live prices, in the background.
  //
  // Bounded concurrency, and never for symbols the feed refuses. A card that
  // fails to upgrade keeps its snapshot value; nothing here can send one back
  // to "--".
  // ---------------------------------------------------------------------
  const upgrade = useCallback(
    (symbols: string[]) => {
      const runId = runIdRef.current;
      const toFetch = symbols.filter((s) => {
        const sym = s.toUpperCase();
        if (noFeed.has(sym)) return false;
        if (inFlightRef.current.has(sym)) return false;
        if (upgradedRef.current.has(sym)) return false;
        return (attemptsRef.current.get(sym) ?? 0) < COMPOSITE_MAX_ATTEMPTS;
      });
      if (!toFetch.length) return;

      toFetch.forEach((s) => {
        const sym = s.toUpperCase();
        inFlightRef.current.add(sym);
        attemptsRef.current.set(sym, (attemptsRef.current.get(sym) ?? 0) + 1);
      });

      fetchCompositeBatch(toFetch, compositeInterval, {
        isCancelled: () => runIdRef.current !== runId,
        onChunk: (partial) => {
          setCards((prev) => {
            const next = { ...prev };
            for (const [sym, entry] of Object.entries(partial.scores)) {
              const key = sym.toUpperCase();
              upgradedRef.current.add(key);
              next[key] = {
                ...next[key],
                score: entry.score,
                signal: entry.signal,
                price: entry.price ?? next[key]?.price,
                change: entry.change ?? next[key]?.change,
                changePct: entry.change_pct ?? next[key]?.changePct,
                sparkline: entry.sparkline ?? next[key]?.sparkline,
                sigma: next[key]?.sigma,
                // The upgrade rescores the composite, not the cross-sectional
                // risk rank, so the snapshot's band rides through untouched.
                riskBand: next[key]?.riskBand,
                riskBandLabel: next[key]?.riskBandLabel,
                barDate: entry.last_bar_date ?? next[key]?.barDate,
                // The moment it landed here, not a server timestamp: this is
                // the age of what is on screen.
                fetchedAt: Date.now(),
                state: "live",
              };
            }
            for (const { symbol: sym } of partial.errors) {
              const key = sym.toUpperCase();
              const existing = next[key];
              // Only a card with NOTHING to show reports a failure. One that
              // already holds snapshot figures keeps them and stays "stale" —
              // a real previous close beats an error message.
              if (!existing || existing.price === undefined) {
                next[key] = { ...existing, state: "failed" };
              }
            }
            return next;
          });
        },
      })
        .then((res) => {
          if (runIdRef.current !== runId) return;
          // Symbols the backend reported as upstream timeouts often finish in
          // background threads moments later and self-cache, so one delayed
          // retry usually lands. Bounded by COMPOSITE_MAX_ATTEMPTS rather than
          // blocked outright after the first, which is how a card used to be
          // able to give up permanently and sit blank until a filter changed.
          const retryable = res.errors
            .map((e) => e.symbol.toUpperCase())
            .filter(
              (s) =>
                !noFeed.has(s) &&
                (attemptsRef.current.get(s) ?? 0) < COMPOSITE_MAX_ATTEMPTS
            );
          if (retryable.length) {
            setTimeout(() => {
              if (runIdRef.current === runId) upgrade(retryable);
            }, COMPOSITE_RETRY_DELAY_MS);
          }
        })
        .finally(() => {
          toFetch.forEach((s) => inFlightRef.current.delete(s.toUpperCase()));
        });
    },
    // `cards` is deliberately absent: this closure no longer reads it (the
    // "already upgraded" check moved to upgradedRef), so keeping it here would
    // rebuild `upgrade` on every arriving chunk for no behaviour.
    [compositeInterval, noFeed]
  );

  const visibleKey = visible.map((v) => v.symbol).join(",");
  const watchlistKey = watchlistSymbols.join(",");

  useEffect(() => {
    if (!showComposite) return;
    // Wait for the snapshot so `noFeed` is known — otherwise the first upgrade
    // pass would spend its budget on the ~half of the universe the feed never
    // answers, at roughly six seconds a symbol.
    if (!snapshotLoaded) return;

    const bySym = new Map(tickers.map((t) => [t.symbol.toUpperCase(), t]));
    const watched = watchlistSymbols
      .map((s) => bySym.get(s.toUpperCase()))
      .filter((t): t is Ticker => !!t);

    const seen = new Set<string>();
    const symbols: string[] = [];
    for (const t of [...visible, ...watched]) {
      const sym = t.symbol.toUpperCase();
      if (seen.has(sym)) continue;
      seen.add(sym);
      symbols.push(t.symbol);
    }
    upgrade(symbols);
    // `upgrade` is intentionally out of the dependency list: it closes over
    // `cards`, which this effect's own results change, and including it would
    // re-run the effect on every arriving chunk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    visibleKey,
    watchlistKey,
    weightsVersion,
    refreshKey,
    showComposite,
    compositeInterval,
    snapshotLoaded,
  ]);

  // Price data the watchlist sidebar draws, in the shape it already expects.
  const priceData = useMemo(() => {
    const out: Record<
      string,
      { price: number; change: number; changePct: number; sparkline: number[] }
    > = {};
    for (const [sym, c] of Object.entries(cards)) {
      if (c.price === undefined) continue;
      out[sym] = {
        price: c.price,
        change: c.change ?? 0,
        changePct: c.changePct ?? 0,
        sparkline: c.sparkline ?? [],
      };
    }
    return out;
  }, [cards]);

  // One reading of the clock for the whole grid, off the same ticking `now` as
  // the "...ago" labels, so every card flips to and from "Market closed"
  // together and in step with the age it replaces.
  const marketClosed = !isEgxOpen(now);

  const renderCard = (t: Ticker) => {
    const c = cards[t.symbol.toUpperCase()];
    return (
      <StockCard
        key={t.symbol}
        symbol={t.symbol}
        name={t.name}
        sector={t.sector}
        price={c?.price}
        change={c?.change}
        changePct={c?.changePct}
        sparklineData={c?.sparkline}
        compositeScore={showComposite ? c?.score ?? null : null}
        compositeSignal={showComposite ? c?.signal ?? null : null}
        // Independent of the score toggle — the risk band is a different axis
        // (how much it moves, not its condition), so it shows either way.
        riskBand={c?.riskBand}
        riskBandLabel={c?.riskBandLabel}
        interval={showComposite ? compositeInterval : undefined}
        // The price change comes from the same batch call as the signal, so it
        // is a change over ONE BAR of the selected interval — a
        // month-over-month move on "Monthly". Without this the card silently
        // changed what its percentage meant.
        changeInterval={showComposite ? compositeInterval : "Daily"}
        state={c?.state ?? "loading"}
        asOf={sessionLabel(c?.barDate)}
        isToday={isTodaysSession(c?.barDate)}
        fetchedAgo={agoLabel(c?.fetchedAt, now)}
        marketClosed={marketClosed}
        onRetry={() => upgrade([t.symbol])}
      />
    );
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  EGX Market Overview
                </h1>
                <p className="mt-1 text-sm text-white/40">
                  Browse Egyptian Exchange listed stocks. Click any card to see
                  detailed analysis.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Compare's way in. It left the mobile tab bar for this
                    button; the desktop top nav still links to it too. */}
                <Link
                  href="/compare"
                  aria-label="Compare stocks"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg border border-white/10 px-0 text-white/60 transition-colors hover:border-accent/30 hover:text-accent md:px-3"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3 4 7l4 4" />
                    <path d="M4 7h16" />
                    <path d="m16 21 4-4-4-4" />
                    <path d="M20 17H4" />
                  </svg>
                  <span className="hidden text-sm md:inline">Compare</span>
                </Link>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  aria-label="Refresh prices"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-accent/30 hover:text-accent"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search — sticky on mobile. The offset reads the nav's own
                footprint rather than a hardcoded 56px, which was 5px short of
                the real 61px and ignored the safe-area inset entirely, so the
                top of this bar sat under the nav on a notched phone. */}
            <div
              className="sticky z-30 -mx-4 mb-3 bg-charcoal-dark/95 px-4 py-2 backdrop-blur-md md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"
              style={{ top: "var(--top-nav-clearance)" }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or symbol..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-accent/50 md:w-auto"
              />
            </div>

            {/* Filters — index on one row, sector on its own row */}
            <div className="mb-3 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <IndexFilter selected={index} onChange={setIndex} />
            </div>
            <div className="mb-3 flex items-center gap-3 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <SectorFilter selected={sector} onChange={setSector} />
              {/* The count stays truthful about what the feed covers rather
                  than quietly shrinking when unquoted names move below. */}
              <span className="whitespace-nowrap text-xs text-white/30">
                {quoted.length} stocks
                {unquoted.length > 0 && (
                  <span className="text-white/20">
                    {" · "}
                    {unquoted.length} without a price feed
                  </span>
                )}
              </span>
            </div>

            {/* Sort — only possible because the snapshot delivers every
                stock's score at once. */}
            <div className="mb-3 flex items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <span className="whitespace-nowrap text-[10px] uppercase tracking-wider text-white/25">
                Sort
              </span>
              {SORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  title={
                    s === "Risk"
                      ? "Calmest first, by past 63-day volatility — the app's strongest measured signal. It predicts how much a stock moves and how deep a hole to expect, never which way it goes."
                      : s === "Score"
                      ? "Highest composite first. The score describes present condition; it does not predict price."
                      : undefined
                  }
                  className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    sort === s
                      ? "bg-accent/20 text-accent"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Composite score toggle + interval — lets users sync card scores with the stock detail page */}
            <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible">
              <button
                onClick={toggleComposite}
                aria-pressed={showComposite}
                className={`min-h-[36px] whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  showComposite
                    ? "bg-accent/20 text-accent"
                    : "border border-white/10 text-white/40 hover:text-white/60"
                }`}
              >
                <LearnTooltip
                  term={`Score: ${showComposite ? "On" : "Off"}`}
                  explanation="Turns on the 0-100 composite score on each card. The number tells you more than a Buy/Hold word does: 61 and 79 are both 'Buy' but they are very different setups. Scores are computed on DAILY bars, the timeframe every entry zone, stop-loss and portfolio alert is built on, and they match the gauge on the stock detail page exactly. You can switch to Weekly or Monthly for trend context, but that resets to Daily next visit."
                >
                  <span>Score: {showComposite ? "On" : "Off"}</span>
                </LearnTooltip>
              </button>
              {showComposite && (
                <div className="flex gap-1.5">
                  {COMPOSITE_INTERVALS.map((iv) => (
                    <button
                      key={iv}
                      onClick={() => pickInterval(iv)}
                      title={
                        iv === "Daily"
                          ? "Daily — the primary view; entry zones, stop-losses and portfolio alerts all use it"
                          : `${iv} — trend context only. Resets to Daily next visit.`
                      }
                      className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        compositeInterval === iv
                          ? "bg-accent/20 text-accent"
                          : "text-white/40 hover:text-white/60"
                      }`}
                    >
                      {iv}
                    </button>
                  ))}
                </div>
              )}
              {/* Say plainly when the grid is NOT showing the primary view —
                  otherwise a whole page of less-reliable signals looks
                  identical to a page of daily ones. */}
              {showComposite && compositeInterval !== "Daily" && (
                <span className="whitespace-nowrap text-[10px] text-[#ffaa00]">
                  Showing {compositeInterval.toLowerCase()} scores — trend context, not entry timing
                </span>
              )}
            </div>

            {/* Stock cards grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-12 text-center">
                <p className="text-sm text-white/40">
                  No stocks found matching your filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {visible.map(renderCard)}
                </div>

                {hasMore && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border border-white/10 px-6 py-2 text-sm text-white/50 transition-colors hover:border-accent/30 hover:text-accent"
                    >
                      Load More ({sorted.length - visible.length} remaining)
                    </button>
                  </div>
                )}

                {/* Stocks the data source does not quote. Collapsed rather than
                    removed: they are real listings, and a reader searching for
                    one needs to find it and be told why it has no price —
                    which is exactly what the indefinite "--" never said. */}
                {unquoted.length > 0 && (
                  <div className="mt-8 border-t border-white/5 pt-4">
                    <button
                      onClick={() => setShowNoFeed((v) => !v)}
                      aria-expanded={showNoFeed}
                      className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left text-sm text-white/40 transition-colors hover:text-white/60"
                    >
                      <span>
                        No feed data ({unquoted.length})
                        <span className="ml-2 text-xs text-white/25">
                          listed, but not quoted by the data source
                        </span>
                      </span>
                      <span className="text-xs">{showNoFeed ? "Hide" : "Show"}</span>
                    </button>
                    {showNoFeed && (
                      <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {unquoted.map(renderCard)}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar: market condition, then watchlist */}
          <div className="w-full lg:w-80">
            <div className="space-y-4 lg:sticky lg:top-[72px]">
              {/* Sits above the watchlist because it frames everything below
                  it: it is about the market, not any one stock. */}
              <MarketRegimeCard />
              <WatchlistPanel tickers={tickers} priceData={priceData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
