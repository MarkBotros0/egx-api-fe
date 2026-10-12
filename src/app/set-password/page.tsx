"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { AuthCard, Field, FormError, SignedInNote, SubmitButton } from "../components/AuthCard";
import { setPasswordRequest } from "../lib/api";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../lib/auth";

function SetPasswordForm() {
  const token = useSearchParams()?.get("token") ?? "";
  const { completeSignIn } = useAuth();
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(token ? null : "This link is incomplete. Open it again from the email.");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < PASSWORD_MIN_LENGTH) return setErr(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
    if (password !== confirmPw) return setErr("The two passwords don't match.");
    setBusy(true);
    try {
      completeSignIn(await setPasswordRequest(token, password));
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not set the password");
      setBusy(false);
    }
  };

  if (done) return <SignedInNote />;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="New password" type="password" autoComplete="new-password" required minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label="Repeat password" type="password" autoComplete="new-password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
      <FormError message={err} />
      <SubmitButton busy={busy} label="Save and sign in" busyLabel="Saving…" />
      <Link href="/forgot-password" className="block text-center text-xs text-white/50 hover:underline">
        Link expired? Request a new one
      </Link>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <AuthCard title="Choose a password">
      <Suspense fallback={null}>
        <SetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
