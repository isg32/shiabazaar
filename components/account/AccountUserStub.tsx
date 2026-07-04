"use client";

import { authClient } from "@/lib/auth/client";

function initials(name: string | null | undefined, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function AccountUserStub() {
  const session = authClient.useSession();
  const user = session.data?.user;

  if (session.isPending) {
    return (
      <div className="px-5 py-5 border-b border-hairline">
        <div className="w-10 h-10 rounded-full bg-surface-soft animate-pulse mb-2" />
        <div className="h-3.5 w-24 bg-surface-soft rounded animate-pulse mb-1.5" />
        <div className="h-3 w-32 bg-surface-soft rounded animate-pulse" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-5 py-5 border-b border-hairline">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-sm mb-2">
        {initials(user.name, user.email)}
      </div>
      <p className="text-sm font-medium text-ink truncate">{user.name || "Account"}</p>
      <p className="text-xs text-muted truncate">{user.email}</p>
    </div>
  );
}
