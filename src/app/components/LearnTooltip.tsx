"use client";

import { useState } from "react";

interface LearnTooltipProps {
  term: string;
  explanation: string;
  children: React.ReactNode;
}

export default function LearnTooltip({
  term,
  explanation,
  children,
}: LearnTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-accent/40">
        {children}
      </span>
      {show && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-lg border border-white/10 bg-charcoal p-3 shadow-xl">
          <p className="mb-1 font-mono text-xs font-semibold text-accent">
            {term}
          </p>
          <p className="text-xs leading-relaxed text-white/70">{explanation}</p>
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-charcoal" />
        </div>
      )}
    </span>
  );
}
