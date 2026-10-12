import { CardSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:py-8">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-white/10" />
      <CardSkeleton />
    </div>
  );
}
