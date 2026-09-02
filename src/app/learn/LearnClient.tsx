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

// ---------------------------------------------------------------- page

export default function LearnClient() {
  const { read, toggle, reset, hydrated } = useProgress();
  const [query, setQuery] = useState("");
  const [activeModule, setActiveModule] = useState<string>(CURRICULUM[0].id);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return ALL_CONCEPTS.filter(({ concept: c }) =>
      [c.title, c.definition, c.whyItMatters, c.howToUse, c.example ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [q]);

  useReveal([q]);

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
      <div className="sticky top-0 z-30 -mx-4 mb-5 bg-charcoal-dark/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-charcoal-dark/80">
        <div className="relative">
          <svg
            viewBox="0 0 16 16"
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30"
          >
            <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — RSI, stop-loss, dividends, Sharpe…"
            aria-label="Search all concepts"
            className="learn-search min-h-[44px] w-full rounded-lg border border-white/[0.08] bg-white/[0.03] pl-9 pr-9 text-white placeholder:text-white/25 focus:border-accent/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-white/35 hover:text-white/80"
            >
              ✕
            </button>
          )}
        </div>

        {/* module pills — the path, always in reach */}
        {!q && (
          <nav
            aria-label="Modules"
            className="no-scrollbar -mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 md:hidden"
          >
            {CURRICULUM.map((m, i) => (
              <button
                key={m.id}
                type="button"
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
    </div>
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
