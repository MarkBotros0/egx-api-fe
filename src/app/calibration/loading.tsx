import { TableSkeleton } from "../components/LoadingSkeleton";

/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-white/10" />
      <TableSkeleton rows={8} />
    </div>
  );
}
