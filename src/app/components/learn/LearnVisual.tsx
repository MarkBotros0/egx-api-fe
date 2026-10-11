"use client";

/**
 * Renders one curriculum diagram (`VisualSpec`, lib/learnVisuals.ts) with the
 * web components. The mobile app has a twin with the same switch
 * (egx-api-mobile/src/features/learn/LearnVisual.tsx) — a new kind needs a
 * case in both.
 */
import { specProps, type VisualSpec } from "../../lib/learnVisuals";
import {
  AllocationDonut,
  BarCompare,
  ConeChart,
  CorrelationGrid,
  LedgerRows,
  MiniChart,
  StepFlow,
  ZoneScale,
} from "./visuals";
import {
  PositionSizer,
  RsiPlayground,
  ScoreBandExplorer,
  StopLossCalculator,
  TBillRace,
} from "./widgets";
import LiveChart from "./LiveChart";

export default function LearnVisual({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "MiniChart":
      return <MiniChart {...specProps(spec)} />;
    case "ZoneScale":
      return <ZoneScale {...specProps(spec)} />;
    case "BarCompare":
      return <BarCompare {...specProps(spec)} />;
    case "StepFlow":
      return <StepFlow {...specProps(spec)} />;
    case "AllocationDonut":
      return <AllocationDonut {...specProps(spec)} />;
    case "CorrelationGrid":
      return <CorrelationGrid {...specProps(spec)} />;
    case "ConeChart":
      return <ConeChart {...specProps(spec)} />;
    case "LedgerRows":
      return <LedgerRows {...specProps(spec)} />;
    case "Stack":
      // Was the curriculum's local <Stack> helper: same element, same class.
      return (
        <div className="space-y-2.5">
          {spec.children.map((child, i) => (
            <LearnVisual key={i} spec={child} />
          ))}
        </div>
      );
    case "LiveChart":
      return (
        <LiveChart
          variant={spec.variant}
          caption={spec.caption}
          fallback={<LearnVisual spec={spec.fallback} />}
        />
      );
    case "RsiPlayground":
      return <RsiPlayground />;
    case "StopLossCalculator":
      return <StopLossCalculator />;
    case "PositionSizer":
      return <PositionSizer />;
    case "TBillRace":
      return <TBillRace />;
    case "ScoreBandExplorer":
      return <ScoreBandExplorer />;
  }
  return null;
}
