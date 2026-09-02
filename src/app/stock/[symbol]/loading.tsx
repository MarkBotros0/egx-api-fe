import { CardSkeleton, ChartSkeleton } from "../../components/LoadingSkeleton";

/**
 * See src/app/loading.tsx for why every segment needs one of these.
 *
 * This is the one users hit most: every dashboard card links here, and the
 * page fetches 400 bars and scores them, so without a boundary the grid just
 * froze under the finger after a tap.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/5" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton height="h-96" />
    </div>
  );
}
