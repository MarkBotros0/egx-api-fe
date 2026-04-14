"use client";

import type { CorrelationMatrix } from "@/app/lib/types";

interface CorrelationHeatmapProps {
  data: CorrelationMatrix;
}

function getCellColor(value: number): string {
  if (value >= 0.7) return "bg-red-500/60";
  if (value >= 0.4) return "bg-red-500/30";
  if (value >= 0.1) return "bg-red-500/10";
  if (value >= -0.1) return "bg-white/5";
  if (value >= -0.4) return "bg-blue-500/20";
  return "bg-blue-500/40";
}

function getTextColor(value: number): string {
  if (value >= 0.7) return "text-white";
  if (value >= 0.4) return "text-white/80";
  return "text-white/60";
}

export default function CorrelationHeatmap({ data }: CorrelationHeatmapProps) {
  const { symbols, matrix } = data;

  if (symbols.length < 2) return null;

  // Mobile: show simplified pairs list
  const highCorrelationPairs: { a: string; b: string; corr: number }[] = [];
  const lowCorrelationPairs: { a: string; b: string; corr: number }[] = [];

  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const c = matrix[i][j];
      if (c > 0.7) highCorrelationPairs.push({ a: symbols[i], b: symbols[j], corr: c });
      else if (c < -0.3) lowCorrelationPairs.push({ a: symbols[i], b: symbols[j], corr: c });
    }
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Correlation Matrix</h2>

      {/* Desktop: full grid */}
      <div className="hidden md:block overflow-x-auto">
        <div className="inline-grid" style={{ gridTemplateColumns: `80px repeat(${symbols.length}, 1fr)` }}>
          {/* Header row */}
          <div />
          {symbols.map((s) => (
            <div key={`h-${s}`} className="px-2 py-1 text-center text-[10px] font-medium text-white/50">
              {s}
            </div>
          ))}

          {/* Data rows */}
          {symbols.map((rowSym, i) => (
            <>
              <div key={`r-${rowSym}`} className="flex items-center px-2 text-xs font-medium text-white/50">
                {rowSym}
              </div>
              {symbols.map((_, j) => {
                const val = matrix[i][j];
                return (
                  <div
                    key={`c-${i}-${j}`}
                    className={`m-0.5 flex items-center justify-center rounded p-2 text-[11px] font-mono ${getCellColor(val)} ${getTextColor(val)}`}
                  >
                    {i === j ? "1.0" : val.toFixed(2)}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Color legend */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-white/30">
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded bg-blue-500/40" />
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded bg-white/5" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded bg-red-500/30" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded bg-red-500/60" />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Mobile: simplified pairs */}
      <div className="md:hidden space-y-3">
        {highCorrelationPairs.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-loss/70">Highly Correlated (risk)</p>
            {highCorrelationPairs.map(({ a, b, corr }) => (
              <div key={`${a}-${b}`} className="flex items-center justify-between rounded-lg bg-loss/5 px-3 py-2 mb-1">
                <span className="text-xs text-white/70">{a} & {b}</span>
                <span className="font-mono text-xs text-loss">{corr.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        {lowCorrelationPairs.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gain/70">Well Diversified</p>
            {lowCorrelationPairs.map(({ a, b, corr }) => (
              <div key={`${a}-${b}`} className="flex items-center justify-between rounded-lg bg-gain/5 px-3 py-2 mb-1">
                <span className="text-xs text-white/70">{a} & {b}</span>
                <span className="font-mono text-xs text-gain">{corr.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        {highCorrelationPairs.length === 0 && lowCorrelationPairs.length === 0 && (
          <p className="text-xs text-white/40">No notable correlation patterns detected.</p>
        )}
      </div>
    </div>
  );
}
