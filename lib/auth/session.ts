"use client";

import { useSyncExternalStore } from "react";

/*
 * Lightweight session state for the storefront and staff shells.
 *
 * The Neon Auth client (`lib/auth/client.ts`) bundles Better Auth plus six
 * plugins and zod — ~470 KB of JavaScript. Pages only need to know who is
 * signed in, so this module reads `/api/auth/get-session` (served from the
 * signed session cookie by the `/api/auth` proxy) and keeps one shared,
 * referentially stable snapshot. The full client is loaded on demand, only for
 * actions (sign out here; sign-in/up/reset pages import it directly).
 */

export type SessionUser = { id: string; email: string; name: string | null; image?: string | null };
type SessionState = { data: { user: SessionUser } | null; isPending: boolean };

const SERVER_STATE: SessionState = { data: null, isPending: true };
let state: SessionState = SERVER_STATE;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Re-read the session (call after signing in or out). */
export function refreshSession(): Promise<void> {
  inflight ??= fetch("/api/auth/get-session", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((d: { user?: SessionUser } | null) => {
      state = { data: d?.user ? { user: d.user } : null, isPending: false };
      listeners.forEach((l) => l());
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.isPending) void refreshSession();
  return () => {
    listeners.delete(listener);
  };
}

/** Drop-in for `authClient.useSession()`: `{ data: { user } | null, isPending }`. */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Sign out via the full auth client (loaded on demand), then update the shared session. */
export async function signOut(): Promise<void> {
  const { authClient } = await import("./client");
  await authClient.signOut();
  await refreshSession();
}
