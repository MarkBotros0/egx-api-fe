import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The app is closed. Every route redirects to /login until the visitor signs
 * in — this is a deny-by-default list, so a page added later is protected
 * without anyone remembering to add it here.
 *
 * Only these are reachable signed out: the login page itself, and the static
 * files the browser needs to render it (Next's build output, the PWA manifest
 * and service worker, and the icons).
 *
 * This is UX, not security. The `egx.auth.present` cookie is set by client JS
 * and carries no signature, so it proves only that someone believes they are
 * signed in. The real guard is the backend, where every /api/* route except
 * login and the cron returns 401 without a valid token.
 */
const PUBLIC_PATHS = ["/login"];

const PUBLIC_FILE_PREFIXES = [
  "/_next",
  "/icons",
  "/favicon",
  "/manifest.json",
  "/sw.js",
  "/apple-touch-icon",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicFile = PUBLIC_FILE_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const hasAuth = req.cookies.get("egx.auth.present")?.value === "1";

  if (isPublicFile) return NextResponse.next();

  if (isPublicPath) {
    // Already signed in? The login page has nothing to offer — send them in.
    if (hasAuth) {
      const home = req.nextUrl.clone();
      home.pathname = "/";
      home.search = "";
      return NextResponse.redirect(home);
    }
    return NextResponse.next();
  }

  if (hasAuth) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  // Preserve where they were headed, so signing in lands them there rather
  // than dumping them on the dashboard.
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next internals and files with an extension. The
  // in-function checks above still run, so this is only a performance filter.
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
