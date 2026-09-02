"use client";

import { useEffect, useState } from "react";

const trimSlashes = (url: string) => url.trim().replace(/\/+$/, "");

/**
 * Shows a generated password exactly once.
 *
 * The backend stores only the bcrypt hash, so this really is the only time it
 * can ever be displayed — the copy is blunt about that rather than leaving the
 * admin to discover it by closing the dialog too early.
 */
export default function PasswordRevealDialog({
  username,
  password,
  onClose,
}: {
  username: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // FE_BASE_URL is inlined at build time (see next.config.js). It is empty on
  // the first render when unset, and `window.location.origin` fills it in after
  // mount — resolved in an effect rather than during render so the server and
  // client markup match. The link must never be blank: an admin pasting
  // credentials with no address is the whole reason this line exists.
  const [appUrl, setAppUrl] = useState(() =>
    trimSlashes(process.env.FE_BASE_URL ?? ""),
  );
  useEffect(() => {
    setAppUrl((current) => current || trimSlashes(window.location.origin));
  }, []);

  // Link, username and password in one block, because it gets pasted into one
  // message. Copying the password alone left the admin to type the username by
  // hand into the same chat, which is where a typo'd login comes from — and
  // credentials with no address are a login the recipient cannot use.
  const message = [
    appUrl && `Link: ${appUrl}`,
    `Username: ${username}`,
    `Password: ${password}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins and in some mobile browsers.
      // Both values are on screen and selectable, so this is not a dead end.
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-charcoal p-5 md:rounded-2xl">
        <h2 className="text-lg font-bold text-white">Login details</h2>
        <p className="mt-1 text-sm text-white/50">
          Copy these now — the password cannot be shown again. If it is lost,
          generate a new one.
        </p>

        {/* Mirrors the copied text exactly, so what is sent matches what was
            checked on screen. */}
        <div className="mt-4 select-all rounded-lg border border-accent/30 bg-accent/5 p-3">
          {appUrl && (
            <div className="mb-2 flex gap-2 border-b border-white/10 pb-2">
              <span className="w-[70px] shrink-0 text-xs text-white/40">Link</span>
              <code className="flex-1 break-all font-mono text-sm text-white">
                {appUrl}
              </code>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-[70px] shrink-0 text-xs text-white/40">Username</span>
            <code className="flex-1 break-all font-mono text-sm text-white">
              {username}
            </code>
          </div>
          <div className="mt-2 flex gap-2 border-t border-white/10 pt-2">
            <span className="w-[70px] shrink-0 text-xs text-white/40">Password</span>
            <code className="flex-1 break-all font-mono text-sm text-white">
              {password}
            </code>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={copy}
            className="min-h-[44px] flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-charcoal-dark transition-opacity active:opacity-70"
          >
            {copied ? "Copied" : "Copy link, username & password"}
          </button>
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-lg border border-white/10 px-4 text-sm text-white/70 transition-colors hover:bg-white/5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
