"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field, FormError, FormNotice, SubmitButton } from "../components/AuthCard";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { signupRequest } from "../lib/api";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, looksLikeEmail } from "../lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!looksLikeEmail(email)) return setErr("Enter a valid email address.");
    if (password.length < PASSWORD_MIN_LENGTH) return setErr(`Use at least ${PASSWORD_MIN_LENGTH} characters for your password.`);
    setBusy(true);
    try {
      await signupRequest(name.trim(), email.trim(), password);
      setSentTo(email.trim());
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create the account");
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      Already have an account?{" "}
      <Link href="/login" className="text-accent hover:underline">
        Sign in
      </Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthCard title="Check your inbox" footer={footer}>
        <FormNotice>
          We sent a link to <span className="font-semibold">{sentTo}</span>. Open it to finish creating your
          account. It works for 24 hours.
        </FormNotice>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create account" subtitle="Track your portfolio and watchlist." footer={footer}>
      <div className="mb-4">
        <GoogleSignInButton onSignedIn={() => router.replace("/")} />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label={`Password (at least ${PASSWORD_MIN_LENGTH} characters)`}
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={err} />
        <SubmitButton busy={busy} label="Create account" busyLabel="Creating…" />
      </form>
    </AuthCard>
  );
}
