"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import { AuthCard, FormError } from "../components/AuthCard";
import { verifyEmailRequest } from "../lib/api";

function Verify() {
  const token = useSearchParams()?.get("token") ?? "";
  const router = useRouter();
  const { completeSignIn } = useAuth();
  const [err, setErr] = useState<string | null>(token ? null : "This link is incomplete. Open it again from the email.");
  // React 18 dev double-runs effects; a verify link is single-use, so the
  // second call would turn success into "already used".
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmailRequest(token)
      .then((session) => {
        completeSignIn(session);
        router.replace("/");
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Could not confirm your email"));
  }, [token, completeSignIn, router]);

  return err ? (
    <div className="space-y-4">
      <FormError message={err} />
      <Link href="/login" className="block text-center text-sm text-accent hover:underline">
        Go to sign in — you can resend the link from there
      </Link>
    </div>
  ) : (
    <p className="text-center text-sm text-white/60">Confirming…</p>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard title="Confirm email">
      <Suspense fallback={null}>
        <Verify />
      </Suspense>
    </AuthCard>
  );
}
