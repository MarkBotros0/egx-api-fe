"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const ADMIN_TAB = {
  href: "/admin",
  label: "Users",
  icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

const TABS = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/portfolio",
    label: "Portfolio",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
      </svg>
    ),
  },
  {
    href: "/learn",
    label: "Learn",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const { isAdmin, isAuthenticated } = useAuth();

  // Three tabs, four as admin. Compare left the bar in favour of a button on
  // the dashboard — see the Compare link in src/app/page.tsx.
  const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;

  // Signed out there is nowhere to tab to, and the bar would otherwise sit
  // under the login form promising pages that all bounce back to it.
  if (!isAuthenticated) return null;

  return (
    // A floating capsule rather than an edge-to-edge bar. The outer element
    // spans the screen only so the pill can centre itself; it is
    // pointer-events-none so the transparent gutters either side stay
    // tappable — content genuinely scrolls past the pill there.
    //
    // Height and offset here are what --bottom-nav-clearance encodes. Change
    // one and change the other.
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
    >
      {/* Fluid, not content-sized. It used to be exactly as wide as its tabs
          (~276px), which on a 440px iPhone 16 Pro Max left a third of the bar
          as empty gutter and made the whole control read as undersized on the
          biggest phones — the devices with the most room. It now fills the
          available width up to a cap, so the tabs grow with the screen instead
          of the gutters doing it. */}
      <div className="pointer-events-auto flex h-[64px] w-full max-w-[430px] items-center gap-1 rounded-full border border-white/10 bg-charcoal/85 px-2 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/stock/")
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              // flex-1 so the tabs share the pill's width evenly; the min-w
              // is the floor for a narrow phone, not the target.
              className={`flex h-[52px] min-w-[62px] flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent"
                  : "text-white/40 active:bg-white/5"
              }`}
            >
              {tab.icon}
              <span className="text-[11px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
