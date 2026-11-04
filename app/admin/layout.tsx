import { requireAdminPage } from "@/lib/staff-guard";
import AdminShell from "./AdminShell";

// Always per-request (role check reads the session cookie) — skips a pointless
// build-time prerender attempt.
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
