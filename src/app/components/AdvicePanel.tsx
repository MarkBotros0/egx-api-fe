"use client";

import Link from "next/link";
import type { Signal } from "@/app/lib/types";

interface AdvicePanelProps {
  signals: Signal[];
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; iconBg: string }> = {
  action_required: {
    bg: "bg-loss/10",
    border: "border-loss/30",
    icon: "!!",
    iconBg: "bg-loss/30 text-loss",
  },
  warning: {
    bg: "bg-loss/5",
    border: "border-loss/20",
    icon: "!",
    iconBg: "bg-loss/20 text-loss",
  },
  opportunity: {
    bg: "bg-gain/5",
    border: "border-gain/20",
    icon: "$",
    iconBg: "bg-gain/20 text-gain",
  },
  info: {
    bg: "bg-accent/5",
    border: "border-accent/20",
    icon: "i",
    iconBg: "bg-accent/20 text-accent",
  },
};

export default function AdvicePanel({ signals }: AdvicePanelProps) {
  if (!signals.length) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-white/40">No signals or advice to show.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/70">
        Signals & Advice
      </h3>

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
        advice. Always do your own research before making investment decisions.
      </p>
    </div>
  );
}
