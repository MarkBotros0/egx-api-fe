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

  // Both credentials in one block, because it gets pasted into one message.
  // Copying the password alone left the admin to type the username by hand
  // into the same chat, which is where a typo'd login comes from.
  const message = `Username: ${username}\nPassword: ${password}`;

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
            {copied ? "Copied" : "Copy username & password"}
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
