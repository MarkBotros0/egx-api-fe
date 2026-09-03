"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/compare", label: "Compare" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/learn", label: "Learn" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Users is NOT one of these. It is an account action rather than a
  // destination in the app — it sits with Log out at the right-hand end, on
  // both sizes, so the nav and the bottom pill carry the same four places
  // every user has.
  const links = NAV_LINKS;
  const onAdmin = pathname.startsWith("/admin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = search.trim().toUpperCase();
    if (sym) {
      router.push(`/stock/${sym}`);
      setSearch("");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Signed out, there is no app to navigate — the only reachable page is the
  // login form, and it should stand alone rather than sitting under a nav bar
  // and a ticker search that would 401 on use.
  if (!isAuthenticated) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-charcoal-dark/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-accent">EGX</span>
          <span className="text-sm text-white/60">Analytics</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-accent font-medium"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticker..."
              className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[16px] text-white placeholder-white/30 outline-none transition-all focus:w-56 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 md:text-sm"
            />
          </form>

          {/* Admin only. Icon-only on mobile where it sits beside the log-out
              icon, icon + label at md: — the same shape as the dashboard's
              Compare button. Height is 36px, not the usual 44px target,
              because it has to match the log-out button it pairs with: the
              nav row is 61px and --top-nav-clearance is that number, so a
              taller control here silently pushes every sticky element on
              every page out of alignment. */}
          {isAdmin && (
            <Link
              href="/admin"
              aria-label="Users"
              title="Manage users"
              aria-current={onAdmin ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center gap-1.5 rounded-md transition-colors hover:bg-white/5 hover:text-white md:w-auto md:px-2.5 ${
                onAdmin ? "text-accent" : "text-white/60"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="hidden text-xs md:inline">Users</span>
            </Link>
          )}

          {/* No "Sign in" branch: this whole bar only renders when signed in. */}
          <div className="hidden items-center gap-3 border-l border-white/10 pl-3 md:flex">
            <span className="max-w-[160px] truncate text-xs text-white/50" title={user?.username}>
              {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-md px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Logout
            </button>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            title={user?.username ? `Log out (${user.username})` : "Log out"}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
