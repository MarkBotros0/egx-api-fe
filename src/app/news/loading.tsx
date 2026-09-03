/**
 * Route-segment Suspense fallback for /news. See src/app/loading.tsx for why
 * every segment needs one. Mirrors the real page's chrome — title, subtitle,
 * a section head, and news-card-shaped rows — so the commit is a fill rather
 * than a flash of unrelated layout.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 h-8 w-28 animate-pulse rounded bg-white/10" />
      <div className="mb-6 h-3 w-44 animate-pulse rounded bg-white/5" />
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-white/10" />
      <ul className="space-y-3">
        {[0, 1, 2].map((i) => (
          <li key={i} className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 flex-none animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3.5 w-3/5 animate-pulse rounded bg-white/10" />
            </div>
            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
