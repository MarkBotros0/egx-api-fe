import { TableSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-white/10" />
      <TableSkeleton rows={5} />
    </div>
  );
}
