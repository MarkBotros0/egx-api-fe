"use client";

import { useState } from "react";

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked on insecure origins and in some mobile browsers.
      // The password is on screen and selectable, so this is not a dead end.
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-white/10 bg-charcoal p-5 md:rounded-2xl">
        <h2 className="text-lg font-bold text-white">Password for {username}</h2>
        <p className="mt-1 text-sm text-white/50">
          Copy this now — it cannot be shown again. If it is lost, generate a
          new one.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <code className="flex-1 select-all break-all font-mono text-base text-white">
            {password}
          </code>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={copy}
            className="min-h-[44px] flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-charcoal-dark transition-opacity active:opacity-70"
          >
            {copied ? "Copied" : "Copy password"}
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
