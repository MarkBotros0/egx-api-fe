"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

/** Shared chrome for the signed-out pages: login, signup, forgot, verify, set-password. */

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[16px] text-white outline-none transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20 md:text-sm";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-charcoal p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-white/50">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-white/50">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      <input {...props} className={inputClass} />
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-xs text-loss">
      {message}
    </div>
  );
}

export function FormNotice({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-white/80">
      {children}
    </div>
  );
}

/**
 * Shown after an emailed link signs someone in. The links always open the web,
 * so a person who signed up in the mobile app would otherwise land on the web
 * dashboard with no word about the app.
 */
export function SignedInNote() {
  return (
    <div className="space-y-4">
      <FormNotice>
        You&apos;re signed in. Using the Borsa Compass app? Sign in there with the same email.
      </FormNotice>
      <Link
        href="/"
        replace
        className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-charcoal-dark"
      >
        Continue
      </Link>
    </div>
  );
}

export function SubmitButton({ busy, label, busyLabel }: { busy: boolean; label: string; busyLabel: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="min-h-[44px] w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-charcoal-dark transition-opacity disabled:opacity-50"
    >
      {busy ? busyLabel : label}
    </button>
  );
}
