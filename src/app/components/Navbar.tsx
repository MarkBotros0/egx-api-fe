"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = search.trim().toUpperCase();
    if (sym) {
      router.push(`/stock/${sym}`);
      setSearch("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-charcoal-dark/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-accent">EGX</span>
          <span className="text-sm text-white/60">Analytics</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
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

        <form onSubmit={handleSearch} className="relative hidden md:block">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker..."
            className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[16px] text-white placeholder-white/30 outline-none transition-all focus:w-56 focus:border-accent/50 focus:ring-1 focus:ring-accent/20 md:text-sm"
          />
        </form>
      </div>

    </nav>
  );
}
