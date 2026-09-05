/**
 * Route-segment Suspense fallback for /dividends. See src/app/loading.tsx for
 * why every segment needs one. Mirrors the page: title, banner, a month head
 * and agenda rows.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 h-8 w-44 animate-pulse rounded bg-white/10" />
      <div className="mb-5 h-3 w-56 animate-pulse rounded bg-white/5" />
      <div className="mb-4 h-16 w-full animate-pulse rounded-xl bg-white/[0.03]" />
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-white/10" />
      <ul className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-14 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
        ))}
      </ul>
    </div>
  );
}
