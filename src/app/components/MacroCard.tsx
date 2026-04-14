"use client";

import type { MacroData } from "@/app/lib/types";

interface MacroCardProps {
  data: MacroData;
}

function DirectionArrow({ direction }: { direction: string | null }) {
  if (direction === "up") return <span className="text-loss">↑</span>;
  if (direction === "down") return <span className="text-gain">↓</span>;
  return <span className="text-white/30">→</span>;
}

function MacroIndicator({
  label,
  value,
  suffix,
  direction,
  detail,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  direction: string | null;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">{label}</p>
      {value != null ? (
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-mono text-lg font-bold text-white">
            {typeof value === "number" && value > 1000 ? value.toLocaleString("en", { maximumFractionDigits: 0 }) : value}
          </span>
          {suffix && <span className="text-xs text-white/30">{suffix}</span>}
          <DirectionArrow direction={direction} />
        </div>
      ) : (
        <p className="mt-1 text-sm text-white/20">Unavailable</p>
      )}
      {detail && <p className="mt-1 text-[10px] text-white/30">{detail}</p>}
    </div>
  );
}

export default function MacroCard({ data }: MacroCardProps) {
  const allNull = !data.egx30?.value && !data.usd_egp?.value && !data.interest_rate?.value;
  if (allNull) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
        <p className="text-xs text-white/30">Macro data unavailable</p>
      </div>
    );
  }

  const egx30 = data.egx30;
  const usdegp = data.usd_egp;
  const rate = data.interest_rate;

  // Generate impact summaries
  let rateDetail: string | undefined;
  if (rate?.value) {
    rateDetail = rate.value >= 20
      ? "High rates make T-bills attractive vs stocks"
      : "Moderate rates favor stock investing";
  }

  let fxDetail: string | undefined;
  if (usdegp?.direction === "up") {
    fxDetail = "Weakening EGP benefits exporters, hurts importers";
  } else if (usdegp?.direction === "down") {
    fxDetail = "Strengthening EGP benefits importers";
  } else if (usdegp?.value) {
    fxDetail = "Currency stability supports the market";
  }

  let egx30Detail: string | undefined;
  if (egx30?.monthly_change_pct) {
    egx30Detail = `${egx30.monthly_change_pct > 0 ? "+" : ""}${egx30.monthly_change_pct.toFixed(1)}% this month`;
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Macro Context</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MacroIndicator
          label="CBE Interest Rate"
          value={rate?.value ?? null}
          suffix="%"
          direction={rate?.direction ?? null}
          detail={rateDetail}
        />
        <MacroIndicator
          label="USD/EGP"
          value={usdegp?.value ?? null}
          direction={usdegp?.direction ?? null}
          detail={fxDetail}
        />
        <MacroIndicator
          label="EGX30 Index"
          value={egx30?.value ?? null}
          direction={egx30?.direction ?? null}
          detail={egx30Detail}
        />
      </div>
    </div>
  );
}
