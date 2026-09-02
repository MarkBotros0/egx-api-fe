import { ChartSkeleton, TableSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-white/10" />
      {/* Macro row, then the summary tiles, then holdings — the real page's
          stacking order, so this fills rather than reflows. */}
      <div className="mb-4 h-16 animate-pulse rounded-xl bg-white/5" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="mb-4">
        <TableSkeleton rows={6} />
      </div>
      <ChartSkeleton />
    </div>
  );
}
