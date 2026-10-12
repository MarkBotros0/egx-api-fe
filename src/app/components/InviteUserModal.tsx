"use client";

import { FormEvent, useState } from "react";
import { inputClass } from "./AuthCard";

/**
 * Full-screen on mobile, centred card on desktop — matching AddHoldingForm.
 * No password field: the person gets an email and chooses their own.
 */
export default function InviteUserModal({
  onInvite,
  onClose,
}: {
  onInvite: (email: string, name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await onInvite(email.trim(), name.trim());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send the invitation");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-charcoal-dark md:items-center md:justify-center md:bg-black/70 md:backdrop-blur-sm">
      <div
        className="flex-1 overflow-y-auto p-4 md:max-h-[90vh] md:w-full md:max-w-md md:flex-none md:rounded-2xl md:border md:border-white/10 md:bg-charcoal md:p-6"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Invite user</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-white/60">Email</span>
            <input type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-white/60">Name (optional)</span>
            <input type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <p className="text-xs text-white/40">
            They get an email with a link to choose their password. The link works for 7 days.
          </p>
          {err ? (
            <div className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">{err}</div>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-charcoal-dark transition-opacity disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
