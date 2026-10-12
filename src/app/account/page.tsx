"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { deleteMyAccount } from "../lib/api";
import { displayName } from "../lib/auth";
import { inputClass } from "../components/AuthCard";

const CONFIRM_WORD = "DELETE";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!user) return null;

  const onDelete = async () => {
    setErr(null);
    setBusy(true);
    try {
      await deleteMyAccount();
      logout();
      router.replace("/login");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not delete the account");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold text-white">Account</h1>

      <section className="mt-6 rounded-xl border border-white/10 bg-charcoal p-4">
        <div className="text-lg font-semibold text-white">{displayName(user)}</div>
        <div className="mt-1 text-sm text-white/50">{user.email}</div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="mt-4 min-h-[44px] rounded-lg border border-white/10 px-4 text-sm text-white/70 transition-colors hover:bg-white/5"
        >
          Log out
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-loss/30 p-4">
        <h2 className="text-base font-semibold text-white">Delete account</h2>
        <p className="mt-1 text-sm text-white/50">
          Permanently deletes your account, portfolio, sale and dividend history, watchlist and alert settings. This
          cannot be undone.
        </p>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-white/60">Type {CONFIRM_WORD} to confirm</span>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" className={inputClass} />
        </label>
        {err ? <p role="alert" className="mt-3 text-xs text-loss">{err}</p> : null}
        <button
          onClick={onDelete}
          disabled={busy || confirmText !== CONFIRM_WORD}
          className="mt-4 min-h-[44px] w-full rounded-lg bg-loss px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
