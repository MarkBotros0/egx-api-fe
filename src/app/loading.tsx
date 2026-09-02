import { CardSkeleton } from "./components/LoadingSkeleton";

/**
 * Route-level loading UI for the dashboard.
 *
 * WHY THIS FILE EXISTS AT ALL — and why one sits in every route segment.
 *
 * In the App Router a segment with no `loading.tsx` has no Suspense boundary,
 * so the router will not commit the navigation until the target page's tree is
 * ready. The OLD page stays on screen the whole time, which makes a tap on the
 * bottom nav feel dead: nothing happens, then everything happens. On a phone on
 * a slow connection that is the difference between "the app is thinking" and
 * "the app is broken", and it is the one a user retaps.
 *
 * With this file the route change is committed immediately and this fallback
 * streams in its place — press, move, then load, which is the order the user
 * asked for and the order every native app uses.
 *
 * It deliberately mirrors the real page's chrome (title, then a card grid) so
 * the transition is a fill rather than a flash of unrelated layout.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/5" />
      </div>
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
