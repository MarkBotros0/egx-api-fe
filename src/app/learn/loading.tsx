/** See src/app/loading.tsx for why every segment needs one of these. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="h-9 w-56 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-white/5" />
      </div>
      {/* Module nav, then concept cards. Learn is text-heavy and loads no
          Recharts, so this is the cheapest of the fallbacks by design. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-28 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
