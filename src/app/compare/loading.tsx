import { ChartSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 h-8 w-52 animate-pulse rounded bg-white/10" />
      <div className="mb-4 h-11 w-full max-w-md animate-pulse rounded-lg bg-white/5" />
      <ChartSkeleton height="h-80" />
    </div>
  );
}
