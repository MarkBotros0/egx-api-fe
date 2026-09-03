import { CardSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 h-8 w-32 animate-pulse rounded bg-white/10" />
      <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
