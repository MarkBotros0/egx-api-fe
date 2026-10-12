"use client";

import { Suspense, useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { AuthCard, Field, FormError, FormNotice, SubmitButton } from "../components/AuthCard";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { LoginError, resendVerification } from "../lib/api";
import { EMAIL_NOT_VERIFIED } from "../lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const next = searchParams?.get("next") || "/";

  useEffect(() => {
    if (isAuthenticated) router.replace(next);
  }, [isAuthenticated, next, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setUnverified(false);
    setResent(false);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (e: unknown) {
      if (e instanceof LoginError && e.code === EMAIL_NOT_VERIFIED) setUnverified(true);
      else setErr(e instanceof Error ? e.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    try {
      await resendVerification(email.trim());
      setResent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send the email");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <GoogleSignInButton onSignedIn={() => router.replace(next)} />
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-xs text-accent hover:underline">
          Forgot password?
        </Link>
      </div>
      {unverified ? (
        <FormNotice>
          Confirm your email first — we sent a link to {email.trim()}.{" "}
          {resent ? (
            <span className="font-semibold">Sent again.</span>
          ) : (
            <button type="button" onClick={onResend} className="font-semibold text-accent underline">
              Resend the link
            </button>
          )}
        </FormNotice>
      ) : null}
      <FormError message={err} />
      <SubmitButton busy={submitting} label="Sign in" busyLabel="Signing in…" />
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your portfolio and watchlist."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
