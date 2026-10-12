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

  useEffect(() => {
    if (!ready || !slot.current || !window.google) return;
    window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCredential, ux_mode: "popup" });
    window.google.accounts.id.renderButton(slot.current, {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: slot.current.offsetWidth || 320,
    });
  }, [ready, onCredential]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-2">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setReady(true)} onReady={() => setReady(true)} />
      <div ref={slot} className="flex min-h-[44px] w-full justify-center" />
      {err ? <p role="alert" className="text-center text-xs text-loss">{err}</p> : null}
      <div className="flex items-center gap-3 py-1 text-xs text-white/30">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
