"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthCard, Field, FormError, FormNotice, SubmitButton } from "../components/AuthCard";
import { forgotPassword } from "../lib/api";
import { looksLikeEmail } from "../lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!looksLikeEmail(email)) return setErr("Enter a valid email address.");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send the email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Reset password"
      subtitle={sent ? undefined : "We'll email you a link to choose a new one."}
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        // Same words whether or not the account exists — see the backend's check_email.
        <FormNotice>
          If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset link is on its
          way. It works for 1 hour.
        </FormNotice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormError message={err} />
          <SubmitButton busy={busy} label="Send reset link" busyLabel="Sending…" />
        </form>
      )}
    </AuthCard>
  );
}
