import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The presence cookie proves only that SOMEONE is signed in, not who or with
// what role — it is set by client JS and carries no signature. Role gating is
// the page's job (it checks isAdmin) and the API's (every /api/users route
// requires an admin). This redirect exists so a signed-out visitor lands on
// the login form instead of an empty admin shell.
const PROTECTED_PREFIXES = ["/portfolio", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isProtected) return NextResponse.next();

  const hasAuth = req.cookies.get("egx.auth.present")?.value === "1";
  if (hasAuth) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/portfolio/:path*", "/admin/:path*"],
};
