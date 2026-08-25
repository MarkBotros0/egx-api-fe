"use client";

import type { MacroData } from "@/app/lib/types";

interface MacroCardProps {
  data: MacroData;
}

/**
 * `positiveIsGood` decides the colour, because "up" means opposite things
 * for these indicators. A rising EGX30 is a bull market (green); a rising
 * USD/EGP is the pound weakening (red). One shared mapping painted a
 * rising EGX30 in the same red used for a losing position, right next to
 * the app's own "the overall market is bullish" signal.
 *
 * `neutral` renders both directions in grey — for the CBE rate, where up
 * and down are context, not good news or bad.
 */
function DirectionArrow({
  direction,
  positiveIsGood = true,
  neutral = false,
}: {
  direction: string | null;
  positiveIsGood?: boolean;
  neutral?: boolean;
}) {
  if (direction !== "up" && direction !== "down") {
    return <span className="text-white/30">→</span>;
  }
  const arrow = direction === "up" ? "↑" : "↓";
  if (neutral) return <span className="text-white/40">{arrow}</span>;
  const isGood = direction === "up" ? positiveIsGood : !positiveIsGood;
  return <span className={isGood ? "text-gain" : "text-loss"}>{arrow}</span>;
}

function MacroIndicator({
  label,
  value,
  suffix,
  direction,
  detail,
  positiveIsGood = true,
  neutral = false,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  direction: string | null;
  detail?: string;
  positiveIsGood?: boolean;
  neutral?: boolean;
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
          <DirectionArrow
            direction={direction}
            positiveIsGood={positiveIsGood}
            neutral={neutral}
          />
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

  // `!= null` rather than truthiness: a flat 0.0% month is real data, and
  // hiding it reads as "unavailable".
  let egx30Detail: string | undefined;
  if (egx30?.monthly_change_pct != null) {
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
          neutral
        />
        <MacroIndicator
          label="USD/EGP"
          value={usdegp?.value ?? null}
          direction={usdegp?.direction ?? null}
          detail={fxDetail}
          positiveIsGood={false}
        />
        <MacroIndicator
          label="EGX30 Index"
          value={egx30?.value ?? null}
          direction={egx30?.direction ?? null}
          detail={egx30Detail}
          positiveIsGood
        />
      </div>
    </div>
  );
}
