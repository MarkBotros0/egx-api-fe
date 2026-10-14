"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { googleSignInRequest } from "../lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface GoogleId {
  initialize(cfg: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: string }): void;
  renderButton(el: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

type CredentialHandler = (r: { credential?: string }) => void;

// GIS wants initialize() once per page load, and its callback is fixed at that
// moment. So the callback calls whichever mounted button registered last, which
// also survives /login -> /signup navigation (a new component instance).
let initialized = false;
let currentHandler: CredentialHandler | null = null;

/**
 * Google Identity Services button. Google hands us a signed ID token; the
 * backend verifies it and returns our own session — no NextAuth, no Firebase.
 */
export default function GoogleSignInButton({ onSignedIn }: { onSignedIn: () => void }) {
  const { completeSignIn } = useAuth();
  const slot = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onCredential = useCallback(
    async (r: { credential?: string }) => {
      if (!r.credential) return;
      setErr(null);
      try {
        completeSignIn(await googleSignInRequest(r.credential));
        onSignedIn();
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Google sign-in failed");
      }
    },
    [completeSignIn, onSignedIn]
  );

  // Always point the shared callback at the latest handler without re-initialising GIS.
  useEffect(() => {
    currentHandler = onCredential;
    return () => {
      if (currentHandler === onCredential) currentHandler = null;
    };
  }, [onCredential]);

  useEffect(() => {
    if (!ready || !slot.current || !window.google) return;
    if (!initialized) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (r) => currentHandler?.(r),
        ux_mode: "popup",
      });
      initialized = true;
    }
    // Icon only: Google writes a text button in the BROWSER's language
    // ("Weiter mit Google" on a German browser), and the mobile app shows the
    // same round G. The slot's aria-label says what it does.
    window.google.accounts.id.renderButton(slot.current, {
      type: "icon",
      theme: "filled_black",
      size: "large",
      shape: "circle",
    });
  }, [ready]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} onReady={() => setReady(true)} />
      <p className="text-center text-xs text-white/40">Continue with</p>
      <div ref={slot} aria-label="Continue with Google" className="flex min-h-[44px] w-full justify-center" />
      {err ? <p role="alert" className="text-center text-xs text-loss">{err}</p> : null}
      <div className="flex items-center gap-3 py-1 text-xs text-white/30">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
