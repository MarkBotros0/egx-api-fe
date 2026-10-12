"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import AdminUsersTable from "../components/AdminUsersTable";
import InviteUserModal from "../components/InviteUserModal";
import {
  deleteUser,
  fetchUsers,
  inviteUser,
  sendUserReset,
  setUserActive,
  type ManagedUser,
} from "../lib/api";

export default function AdminPage() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, isAdmin, load]);

  const handleInvite = async (email: string, name: string) => {
    const res = await inviteUser(email, name);
    setShowInvite(false);
    setNotice(`Invitation sent to ${res.user.email}.`);
    await load();
  };

  const handleSendReset = async (u: ManagedUser) => {
    if (!confirm(`Email ${u.email} a link to choose a new password? Their current password keeps working until they use it.`)) return;
    setBusyId(u.id);
    setError(null);
    setNotice(null);
    try {
      const res = await sendUserReset(u.id);
      setNotice(res.sent === "invite" ? `Invitation re-sent to ${u.email}.` : `Reset link sent to ${u.email}.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not send the email");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (u: ManagedUser) => {
    setBusyId(u.id);
    setError(null);
    try {
      await setUserActive(u.id, !u.is_active);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update the user");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    // Spelled out because it is irreversible and takes their data with it —
    // there is no soft delete and no undo.
    if (
      !confirm(
        `Delete ${u.email}? This permanently removes their portfolio, sale history and watchlist. This cannot be undone.`
      )
    )
      return;
    setBusyId(u.id);
    setError(null);
    try {
      await deleteUser(u.id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not delete the user");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-white/5" />
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  // The backend 403s regardless; this just avoids showing an admin-shaped
  // page to someone who will only ever see errors in it.
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-white">Admins only</h1>
        <p className="mt-2 text-sm text-white/50">
          Your account does not have access to user management.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block min-h-[44px] rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-white/50">
            {users.length} account{users.length === 1 ? "" : "s"}.
          </p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="hidden min-h-[44px] shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-charcoal-dark transition-opacity active:opacity-70 md:block"
        >
          + Invite user
        </button>
      </div>

      {notice ? (
        <div role="status" className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-white/80">
          {notice}
        </div>
      ) : null}

      {error && (
        <div className="mb-4 rounded-lg border border-loss/30 bg-loss/10 px-3 py-2.5 text-sm text-loss">
          {error}
        </div>
      )}

      <AdminUsersTable
        users={users}
        onSendReset={handleSendReset}
        onToggleActive={handleToggle}
        onDelete={handleDelete}
        busyId={busyId}
        currentUserId={user?.id}
      />

      {/* Mobile FAB, matching the portfolio page. The offset comes from
          --bottom-nav-clearance: this used to be a bare bottom-[76px] with no
          safe-area term, so the nav painted over the bottom of the button on
          any phone with a home indicator. */}
      <button
        onClick={() => setShowInvite(true)}
        aria-label="Invite user"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-charcoal-dark shadow-lg transition-transform active:scale-95 md:hidden"
        style={{ bottom: "calc(var(--bottom-nav-clearance) + 12px)" }}
      >
        +
      </button>

      {showInvite && <InviteUserModal onInvite={handleInvite} onClose={() => setShowInvite(false)} />}
    </div>
  );
}
