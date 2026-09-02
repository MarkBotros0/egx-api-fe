"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const TOKEN_KEY = "egx.auth.token";
const USER_KEY = "egx.auth.user";
const PRESENCE_COOKIE = "egx.auth.present";
const UNAUTHORIZED_EVENT = "egx:unauthorized";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export type UserRole = "user" | "admin";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

/** Anything that isn't literally "admin" is a plain user. */
function asRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

const Ctx = createContext<AuthCtx | null>(null);

function setPresenceCookie(present: boolean) {
  if (typeof document === "undefined") return;
  if (present) {
    document.cookie = `${PRESENCE_COOKIE}=1; path=/; max-age=2592000; samesite=lax`;
  } else {
    document.cookie = `${PRESENCE_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.username === "string") {
      // Cached from a previous session and only ever used optimistically —
      // /auth/me re-reads the role from the DB on every load, and the backend
      // enforces it regardless of what is in localStorage.
      return { id: parsed.id, username: parsed.username, role: asRole(parsed.role) };
    }
  } catch {}
  return null;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Wipe the service worker's Cache Storage.
 *
 * sw.js is network-first for /api/* and navigations, but it FALLS BACK to the
 * cache when a request fails. Without this, a signed-out person on a shared
 * phone could go offline (or catch a network blip) and the worker would
 * happily re-serve the last dashboard and API responses it saw. Clearing the
 * token alone would make "signed out" a claim rather than a fact.
 *
 * Fire-and-forget: the Cache API is unavailable on insecure origins and in
 * private windows, and a failure here must never block the sign-out itself.
 */
function clearCachedResponses() {
  if (typeof caches === "undefined") return;
  caches
    .keys()
    .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    .catch(() => {});
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setPresenceCookie(false);
  clearCachedResponses();
}

export function notifyUnauthorized() {
  if (typeof window === "undefined") return;
  clearStoredAuth();
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = getStoredToken();
    const storedUser = readStoredUser();

    if (!stored) {
      setIsLoading(false);
      setPresenceCookie(false);
      return;
    }

    if (storedUser) {
      setUser(storedUser);
      setToken(stored);
      setPresenceCookie(true);
    }

    // Validate the token with the backend. A rotated AUTH_SECRET makes every
    // existing signature invalid, so this call fails with 401 and logs the
    // user out on the first page load after a secret rotation.
    fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          clearStoredAuth();
          setUser(null);
          setToken(null);
          return;
        }
        const data = await res.json();
        if (res.ok && data?.id && data?.username) {
          const fresh: AuthUser = {
            id: data.id,
            username: data.username,
            role: asRole(data.role),
          };
          setUser(fresh);
          setToken(stored);
          setPresenceCookie(true);
          try {
            localStorage.setItem(USER_KEY, JSON.stringify(fresh));
          } catch {}
        }
      })
      .catch(() => {
        // Network error — keep optimistic state; a real 401 will be surfaced
        // when the user performs a protected action.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setToken(null);
      setPresenceCookie(false);
      // Every page is protected now, so a rejected token means the current
      // page is dead wherever the user happens to be — send them to the login
      // form rather than leaving them on a shell that 401s on every fetch.
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path !== "/login") {
          const next = encodeURIComponent(path);
          window.location.href = `/login?next=${next}`;
        }
      }
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.detail || data?.error || "Invalid username or password";
      setError(msg);
      throw new Error(msg);
    }
    const newToken: string = data.access_token;
    const newUser: AuthUser = {
      id: data.user?.id,
      username: data.user?.username,
      role: asRole(data.user?.role),
    };
    try {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    } catch {}
    setPresenceCookie(true);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.role === "admin",
      isLoading,
      error,
      login,
      logout,
    }),
    [user, token, isLoading, error, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,
      login: async () => {},
      logout: () => {},
    };
  }
  return ctx;
}
