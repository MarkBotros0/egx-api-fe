"use client";

import type { Concept, Level } from "../../learn/curriculum";

const LEVEL_LABEL: Record<Level, string> = {
  start: "start here",
  core: "core",
  deep: "deeper",
};

export default function ConceptCard({
  concept,
  hue,
  read,
  onToggleRead,
  anchorId,
}: {
  concept: Concept;
  hue: string;
  read: boolean;
  onToggleRead: () => void;
  anchorId: string;
}) {
  const level = concept.level ?? "core";

  return (
    <article
      id={concept.id ?? anchorId}
      data-concept={anchorId}
      className="learn-card group relative scroll-mt-28 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] transition-colors duration-200 hover:border-white/[0.12]"
    >
      {/* the rail: fills in when the concept is marked read */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[2px] transition-opacity duration-300"
        style={{ background: hue, opacity: read ? 0.9 : 0.18 }}
      />

      <div className="p-4 pl-5">
        <header className="mb-2.5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <span
              className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em]"
              style={{ color: hue, opacity: 0.75 }}
            >
              {LEVEL_LABEL[level]}
            </span>
            <h3 className="text-[15px] font-semibold leading-snug text-white">
              {concept.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onToggleRead}
            aria-pressed={read}
            aria-label={read ? `Mark ${concept.title} unread` : `Mark ${concept.title} read`}
            title={read ? "Mark unread" : "Mark read"}
            className="-mr-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white/30 transition-colors hover:text-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span
              className="grid h-[18px] w-[18px] place-items-center rounded-full border transition-all duration-200"
              style={{
                borderColor: read ? hue : "rgba(255,255,255,0.22)",
                background: read ? hue : "transparent",
              }}
            >
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
                <path
                  d="M2.5 6.2l2.4 2.4L9.6 3.9"
                  fill="none"
                  stroke={read ? "#0a0a0f" : "currentColor"}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={read ? 1 : 0.9}
                />
              </svg>
            </span>
          </button>
        </header>

        <p className="mb-3 text-[13px] leading-relaxed text-white/70">
          {concept.definition}
        </p>

        {concept.visual && <div className="mb-3">{concept.visual}</div>}

        <div className="space-y-2.5">
          <Block label="Why it matters" text={concept.whyItMatters} />
          <Block label="How to use it" text={concept.howToUse} />
        </div>

        {concept.example && (
          <div
            className="mt-3 rounded-md border-l-2 bg-white/[0.03] px-3 py-2.5"
            style={{ borderColor: hue }}
          >
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              For example
            </span>
            <p className="font-mono text-[11px] leading-relaxed text-white/70">
              {concept.example}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
        {label}
      </span>
      <p className="text-[12px] leading-relaxed text-white/50">{text}</p>
    </div>
  );
}
