import { auth } from "./auth/server";
import { db } from "./db";
import { NextResponse } from "next/server";

/**
 * Route-handler guard for the clerk desk. Passes for clerks OR admins (an admin
 * implicitly has desk access). Mirrors `requireAdmin` — returns `null` on success
 * or `{ error: NextResponse }` (401 / 403).
 */
export async function requireClerk(): Promise<{ error: NextResponse } | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true, isClerk: true },
  });
  if (!user?.isAdmin && !user?.isClerk) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return null;
}

/**
 * Resolve the current user's staff role for server components. Returns all-false
 * when signed out.
 */
export async function getStaffRole(): Promise<{ isAdmin: boolean; isClerk: boolean }> {
  const staff = await getStaffUser();
  return { isAdmin: staff?.isAdmin ?? false, isClerk: staff?.isClerk ?? false };
}

/**
 * The current staff user's DB row (id + roles), or null when signed out / not a
 * staff member. Use for the `recordedById` / `userId` audit stamps on desk writes.
 */
export async function getStaffUser(): Promise<{ id: string; isAdmin: boolean; isClerk: boolean } | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, isAdmin: true, isClerk: true },
  });
  if (!user || (!user.isAdmin && !user.isClerk)) return null;
  return user;
}

/**
 * Route-handler guard for the BI dashboard (`/api/dashboard/*`). Passes for
 * readers OR admins; banned users are refused. Returns `null` on success.
 */
export async function requireDashboard(): Promise<{ error: NextResponse } | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true, isReader: true, banned: true },
  });
  if (!user || user.banned || (!user.isAdmin && !user.isReader)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return null;
}

/** The signed-in user's dashboard roles for server components (all false when signed out). */
export async function getDashboardViewer(): Promise<{ isAdmin: boolean; isReader: boolean }> {
  const { data: session } = await auth.getSession();
  if (!session?.user) return { isAdmin: false, isReader: false };
  const user = await db.user.findUnique({ where: { email: session.user.email }, select: { isAdmin: true, isReader: true } });
  return { isAdmin: !!user?.isAdmin, isReader: !!user?.isReader };
}
