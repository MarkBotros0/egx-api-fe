"use client";

import { useEffect, useState } from "react";

import { fetchPEFeedStatus } from "@/app/lib/api";

const STALE_AFTER_HOURS = 48;

export default function PEFreshnessBanner() {
  const [status, setStatus] = useState<{
    last_successful_fetch: string | null;
    last_attempt_status: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPEFeedStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        // Silent — banner is best-effort; never block the page.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status?.last_successful_fetch) return null;

  const last = new Date(status.last_successful_fetch);
  const ageHours = (Date.now() - last.getTime()) / 36e5;
  if (ageHours < STALE_AFTER_HOURS) return null;

  const ageDays = Math.floor(ageHours / 24);
  const attemptNote =
    status.last_attempt_status && status.last_attempt_status !== "ok"
      ? ` Last attempt: ${status.last_attempt_status}.`
      : "";

  return (
    <div className="rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2 text-xs text-amber-200/80">
      P/E data last updated {ageDays} day{ageDays === 1 ? "" : "s"} ago — the EGX feed
      may be temporarily unavailable.{attemptNote}
    </div>
  );
}
