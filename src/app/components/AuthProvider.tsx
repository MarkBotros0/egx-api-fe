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

export interface AuthUser {
  id: string;
  username: string;
}

interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
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
      return parsed;
    }
  } catch {}
  return null;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setPresenceCookie(false);
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
          const fresh = { id: data.id, username: data.username } as AuthUser;
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
      // If the user is on a protected page when their token is rejected,
      // kick them to /login so they can re-authenticate. On public pages
      // we leave them where they are.
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/portfolio")) {
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
    const newUser: AuthUser = data.user;
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
      isLoading: false,
      error: null,
      login: async () => {},
      logout: () => {},
    };
  }
  return ctx;
}
