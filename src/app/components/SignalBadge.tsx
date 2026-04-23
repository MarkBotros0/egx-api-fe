"use client";

import type { CompositeSignal } from "../lib/types";

interface SignalBadgeProps {
  signal: CompositeSignal | null;
  size?: "sm" | "md";
}

const STYLES: Record<
  CompositeSignal,
  { label: string; bg: string; text: string; dot: string; strong: boolean }
> = {
  "Strong Buy":  { label: "STRONG BUY",  bg: "bg-gain",      text: "text-black",      dot: "bg-black/60",    strong: true  },
  "Buy":         { label: "BUY",         bg: "bg-gain/15",   text: "text-gain",       dot: "bg-gain",        strong: false },
  "Hold":        { label: "HOLD",        bg: "bg-accent/15", text: "text-accent",     dot: "bg-accent",      strong: false },
  "Sell":        { label: "SELL",        bg: "bg-loss/15",   text: "text-loss",       dot: "bg-loss",        strong: false },
  "Strong Sell": { label: "STRONG SELL", bg: "bg-loss",      text: "text-white",      dot: "bg-white/70",    strong: true  },
};

export default function SignalBadge({ signal, size = "sm" }: SignalBadgeProps) {
  if (!signal) return null;
  const s = STYLES[signal];
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  const fontSize = size === "sm" ? "text-[10px]" : "text-xs";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const border = s.strong ? "" : "ring-1 ring-inset ring-current/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wider ${padding} ${fontSize} ${s.bg} ${s.text} ${border}`}
    >
      <span className={`rounded-full ${dotSize} ${s.dot}`} />
      {s.label}
    </span>
  );
}
