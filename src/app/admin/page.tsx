"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import AdminUsersTable from "../components/AdminUsersTable";
import CreateUserModal from "../components/CreateUserModal";
import PasswordRevealDialog from "../components/PasswordRevealDialog";
import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  setUserActive,
  type ManagedUser,
} from "../lib/api";

interface Revealed {
  username: string;
  password: string;
}

export default function AdminPage() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState<Revealed | null>(null);
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

  const handleCreate = async (username: string, password?: string) => {
    const res = await createUser(username, password);
    setShowCreate(false);
    if (res.generated_password) {
      setRevealed({ username: res.user.username, password: res.generated_password });
    }
    await load();
  };

  const handleReset = async (u: ManagedUser) => {
    if (
      !confirm(
        `Generate a new password for ${u.username}? Their current password will stop working immediately.`
      )
    )
      return;
    setBusyId(u.id);
    try {
      const res = await resetUserPassword(u.id);
      if (res.generated_password) {
        setRevealed({ username: u.username, password: res.generated_password });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not reset the password");
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
        `Delete ${u.username}? This permanently removes their portfolio, sale history and watchlist. This cannot be undone.`
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
            {users.length} account{users.length === 1 ? "" : "s"}. Admin access is
            set by the <code className="font-mono text-white/70">AUTH_ADMINS</code>{" "}
            environment variable, not from here.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="hidden min-h-[44px] shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-charcoal-dark transition-opacity active:opacity-70 md:block"
        >
          + Add user
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-loss/30 bg-loss/10 px-3 py-2.5 text-sm text-loss">
          {error}
        </div>
      )}

      <AdminUsersTable
        users={users}
        onResetPassword={handleReset}
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
        onClick={() => setShowCreate(true)}
        aria-label="Add user"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-charcoal-dark shadow-lg transition-transform active:scale-95 md:hidden"
        style={{ bottom: "calc(var(--bottom-nav-clearance) + 12px)" }}
      >
        +
      </button>

      {showCreate && (
        <CreateUserModal
          onCreate={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {revealed && (
        <PasswordRevealDialog
          username={revealed.username}
          password={revealed.password}
          onClose={() => setRevealed(null)}
        />
      )}
    </div>
  );
}
