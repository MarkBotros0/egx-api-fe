"use client";

/**
 * The Learn page shell: navigation, search, progress, and the hash router
 * that makes every in-app "Learn more" link land on the right card.
 *
 * Progress lives in localStorage only. It is a reading aid, not user data —
 * there is no backend for it, it is per-device, and losing it costs nothing.
 * It is read in an effect rather than during render so the server and client
 * markup match on first paint.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CURRICULUM,
  ALL_CONCEPTS,
  TOTAL_CONCEPTS,
  conceptKey,
  type Module,
} from "./curriculum";
import ConceptCard from "../components/learn/ConceptCard";

const STORAGE_KEY = "egx.learn.progress";

// ---------------------------------------------------------------- progress

function useProgress() {
  const [read, setRead] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setRead(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* private mode, corrupt value — an empty set is a fine outcome */
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback((key: string) => {
    setRead((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* nothing to do — the toggle still works for this session */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setRead(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { read, toggle, reset, hydrated };
}

// ---------------------------------------------------------------- reveal

/** Fade-and-lift cards as they enter. CSS disables it under reduced motion. */
function useReveal(deps: unknown[]) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = document.querySelectorAll<HTMLElement>(".learn-card:not(.is-revealed)");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ---------------------------------------------------------------- search

/**
 * Fold punctuation so the reader does not have to guess our hyphens.
 *
 * The terms this page teaches are written with punctuation the reader has no
 * reason to reproduce — "stop-loss", "T-bill", "P/E", "risk-adjusted". A plain
 * substring match meant **"stop loss" returned nothing while "stop-loss"
 * returned nine**, and the old placeholder quietly worked around it by
 * spelling the hyphen out. Applied to BOTH the query and the text, so the two
 * always meet in the same shape.
 */
function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------- page

export default function LearnClient() {
  const { read, toggle, reset, hydrated } = useProgress();
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string>(CURRICULUM[0].id);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const pillsRef = useRef<HTMLElement | null>(null);

  const q = normalizeSearch(query);
  const results = useMemo(() => {
    if (!q) return null;
    return ALL_CONCEPTS.filter(({ concept: c }) =>
      normalizeSearch(
        [c.title, c.definition, c.whyItMatters, c.howToUse, c.example ?? ""].join(" ")
      ).includes(q)
    );
  }, [q]);

  useReveal([q]);

  // `/` focuses the search, the convention in every terminal-shaped tool this
  // audience already uses. Guarded so it does not steal the key from someone
  // typing a slash into a field — including this one.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Deep links: /learn#rsi, /learn#entry_exit_zones, and every learn_concept
  // an in-app signal emits. Clear any search so the target isn't filtered out,
  // reopen its module, scroll to it and flash it.
  useEffect(() => {
    const go = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      setQuery("");
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (!el) return;
        el.closest("details")?.setAttribute("open", "");
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("learn-flash");
        window.setTimeout(() => el.classList.remove("learn-flash"), 2200);
      });
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  // Which module the reader is currently inside — drives the nav highlight.
  useEffect(() => {
    if (q) return;
    const sections = CURRICULUM.map((m) => document.getElementById(m.id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveModule(top.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [q]);

  // Keep the active pill in view as the reader scrolls through the modules.
  //
  // The strip holds nine pills and shows about three on a phone, so without
  // this the highlight moves onto a pill that is off-screen: the reader is in
  // module 6 and the strip is still showing 1-3, which makes it read as broken
  // rather than as a position indicator.
  //
  // Scrolls the STRIP's own scrollLeft rather than calling scrollIntoView —
  // that walks every scrollable ancestor and would yank the page vertically
  // while the reader is mid-scroll, fighting the very gesture that triggered
  // this.
  useEffect(() => {
    const nav = pillsRef.current;
    if (!nav) return;
    const pill = nav.querySelector<HTMLElement>(`[data-module="${activeModule}"]`);
    if (!pill) return;

    const target = pill.offsetLeft - (nav.clientWidth - pill.offsetWidth) / 2;
    const left = Math.max(0, Math.min(target, nav.scrollWidth - nav.clientWidth));
    if (Math.abs(left - nav.scrollLeft) < 4) return;

    nav.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeModule]);

  const doneCount = hydrated ? read.size : 0;
  const pct = Math.round((doneCount / TOTAL_CONCEPTS) * 100);

  const jump = (id: string) => {
    setQuery("");
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 md:pt-10">
      {/* ---------------------------------------------------------- hero */}
      <header className="mb-7">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
          EGX Analytics · Learn
        </p>
        <h1 className="max-w-2xl text-[26px] font-bold leading-[1.15] tracking-tight text-white md:text-[38px]">
          Learn the EGX,
          <br />
          <span className="text-accent">one idea at a time.</span>
        </h1>
        <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/45 md:text-sm">
          Every number this app shows you, explained — with the diagram, the
          worked example in EGP, and the honest limits. Nine modules, in the
          order you actually need them.
        </p>

        {/* progress */}
        <div className="mt-5 max-w-md">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              {doneCount} of {TOTAL_CONCEPTS} read
            </span>
            {doneCount > 0 && (
              <button
                type="button"
                onClick={reset}
                className="font-mono text-[10px] uppercase tracking-wider text-white/25 transition-colors hover:text-white/60"
              >
                reset
              </button>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- search */}
      {/* Sticks BELOW the top nav, not at top-0. It was sticking correctly at
          0 the whole time — directly underneath an opaque `z-50` navbar, so it
          vanished the moment you scrolled. The offset is a variable because
          the nav's height includes the safe-area inset, which is 0 in a
          desktop browser and non-zero on a notched phone. */}
      <div
        className="sticky z-30 -mx-4 mb-5 bg-charcoal-dark/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-charcoal-dark/80"
        style={{ top: "var(--top-nav-clearance)" }}
      >
        {/* Module pills — the path, always in reach. These sit ABOVE the
            search box: the modules are the order the page is meant to be
            walked, and search is the shortcut for when you already know the
            term you want. */}
        {!q && (
          <nav
            ref={pillsRef}
            aria-label="Modules"
            className="no-scrollbar -mx-4 mb-2.5 flex gap-1.5 overflow-x-auto px-4 md:hidden"
          >
            {CURRICULUM.map((m, i) => (
              <button
                key={m.id}
                type="button"
                data-module={m.id}
                onClick={() => jump(m.id)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors"
                style={{
                  borderColor:
                    activeModule === m.id ? m.hue : "rgba(255,255,255,0.08)",
                  color: activeModule === m.id ? m.hue : "rgba(255,255,255,0.5)",
                  background: activeModule === m.id ? `${m.hue}1f` : "transparent",
                }}
              >
                <span className="font-mono text-[9px] opacity-60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {m.title}
              </button>
            ))}
          </nav>
        )}

        {/* The search field.
            Shaped like a terminal's command bar rather than a generic web
            input, because that is what this page is: a reference you go INTO
            with a term already in mind. Hence the `/` shortcut, the live match
            count in the field itself, and Escape to get out — the conventions
            of the tools this audience already uses.
            The count sits IN the field because it is feedback on what you are
            typing; the heading below still labels the results section. */}
        <div
          className={`group relative rounded-xl border transition-colors ${
            searchFocused
              ? "border-accent/45 bg-white/[0.055]"
              : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]"
          }`}
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className={`pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
              searchFocused ? "text-accent" : "text-white/30"
            }`}
          >
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search concepts"
            aria-label="Search all concepts"
            className="learn-search min-h-[48px] w-full rounded-xl bg-transparent pl-10 pr-24 text-white placeholder:text-white/25 focus:outline-none"
          />

          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {results && (
              /* Live count. Mono because it is a number that changes under
                 the reader's fingers, matching how every other figure in the
                 app is set. */
              <span
                aria-live="polite"
                className={`font-mono text-[11px] tabular-nums ${
                  results.length ? "text-white/40" : "text-white/25"
                }`}
              >
                {results.length}
              </span>
            )}
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="grid h-9 w-9 place-items-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/80"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            ) : (
              /* Keyboard hint, desktop only — there is no `/` key to press on
                 a phone, so showing it there would be furniture. */
              <kbd className="mr-1 hidden rounded border border-white/[0.09] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/30 md:block">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- results */}
      {results ? (
        <section>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            {results.length} {results.length === 1 ? "concept" : "concepts"} match “
            {query.trim()}”
          </p>
          {results.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/60">Nothing matches that yet.</p>
              <p className="mt-1.5 text-[12px] text-white/35">
                Try a shorter word — “stop”, “volume”, “tax”, “EGX30”.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {results.map(({ concept, module }) => {
                const key = conceptKey(concept);
                return (
                  <ConceptCard
                    key={`${module.id}-${key}`}
                    concept={concept}
                    hue={module.hue}
                    anchorId={key}
                    read={read.has(key)}
                    onToggleRead={() => toggle(key)}
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <div className="md:grid md:grid-cols-[210px_minmax(0,1fr)] md:gap-8">
          {/* ------------------------------------------------ desktop rail */}
          <nav
            aria-label="Modules"
            className="sticky top-24 hidden h-fit self-start md:block"
          >
            <ol className="m-0 list-none space-y-0 p-0">
              {CURRICULUM.map((m, i) => {
                const total = m.concepts.length;
                const done = m.concepts.filter((c) => read.has(conceptKey(c))).length;
                const active = activeModule === m.id;
                return (
                  <li key={m.id} className="relative pl-5">
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-0 h-full w-px"
                      style={{
                        background:
                          i === CURRICULUM.length - 1
                            ? "transparent"
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="absolute left-0 top-[9px] h-[11px] w-[11px] rounded-full border-2 transition-colors"
                      style={{
                        borderColor: active ? m.hue : "rgba(255,255,255,0.14)",
                        background:
                          done === total && total > 0
                            ? m.hue
                            : "#0a0a0f",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => jump(m.id)}
                      className="block w-full py-1.5 pb-4 text-left transition-colors"
                    >
                      <span
                        className="block text-[12px] font-medium leading-snug"
                        style={{
                          color: active ? m.hue : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {m.title}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-white/25">
                        {done}/{total}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* ---------------------------------------------------- modules */}
          <div className="min-w-0">
            {CURRICULUM.map((m, i) => (
              <ModuleSection
                key={m.id}
                module={m}
                index={i}
                read={read}
                onToggle={toggle}
              />
            ))}

            <p className="mt-10 border-t border-white/[0.06] pt-5 text-[11px] leading-relaxed text-white/30">
              Nothing here is investment advice. The composite score is an
              educational tool built from price data — it does not predict where
              a stock goes next, and it knows nothing about a company&apos;s
              earnings quality, debt, or the news. Decide with your own money in
              mind.
            </p>
          </div>
        </div>
      )}

      <BackToTop />
    </div>
  );
}

/**
 * Jump back to the top of the Learn page.
 *
 * Learn is 68 concepts across nine modules — by far the longest scroll in the
 * app — and the module pills and search that open it are how most people
 * navigate it. Without this, getting back to them from the bottom of "The
 * Egyptian Context" is a long thumb drag on a phone.
 *
 * Hidden until the reader is actually deep enough to want it, so it never
 * covers content on a short screen for no reason. It clears the floating
 * bottom nav via `--bottom-nav-clearance` — the same variable the portfolio
 * and admin FABs use, because three hardcoded copies of that offset have
 * already drifted apart once in this codebase.
 */
function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // One viewport of scrolling before it appears: enough that the reader has
    // committed to the page, not so much that it arrives only at the very end.
    const onScroll = () => setShow(window.scrollY > window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          // Respects the reader's reduced-motion setting: a long smooth scroll
          // is exactly the kind of movement that setting exists to stop.
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      aria-label="Back to top"
      title="Back to top"
      className="fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-charcoal/90 text-white/60 shadow-lg backdrop-blur-md transition-colors hover:border-accent/40 hover:text-accent md:right-8"
      style={{ bottom: "calc(var(--bottom-nav-clearance) + 12px)" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------- module

function ModuleSection({
  module: m,
  index,
  read,
  onToggle,
}: {
  module: Module;
  index: number;
  read: Set<string>;
  onToggle: (key: string) => void;
}) {
  const total = m.concepts.length;
  const done = m.concepts.filter((c) => read.has(conceptKey(c))).length;
  const complete = total > 0 && done === total;

  // The id is the OLD section anchor, deliberately unprefixed: /learn#egx,
  // /learn#risk-management and the other seven worked before this redesign
  // and must keep working. Module ids are hyphenated and concept ids use
  // underscores, so the two namespaces cannot collide.
  return (
    <details id={m.id} open className="group mb-9 scroll-mt-28">
      <summary className="mb-4 cursor-pointer list-none">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-[12px] font-semibold transition-colors"
            style={{
              color: complete ? "#0a0a0f" : m.hue,
              background: complete ? m.hue : `${m.hue}24`,
              border: `1px solid ${m.hue}57`,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold leading-tight text-white md:text-[19px]">
                {m.title}
              </h2>
              <svg
                viewBox="0 0 10 10"
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 text-white/30 transition-transform duration-200 group-open:rotate-180"
              >
                <path
                  d="M1 3.5L5 7.5L9 3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-0.5 text-[12px] leading-snug text-white/40">{m.goal}</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
              {done} of {total} read
            </p>
          </div>
        </div>
      </summary>

      {m.overview && <div className="mb-4">{m.overview}</div>}

      <div className="grid gap-3 md:grid-cols-2">
        {m.concepts.map((c) => {
          const key = conceptKey(c);
          return (
            <ConceptCard
              key={key}
              concept={c}
              hue={m.hue}
              anchorId={key}
              read={read.has(key)}
              onToggleRead={() => onToggle(key)}
            />
          );
        })}
      </div>
    </details>
  );
}
