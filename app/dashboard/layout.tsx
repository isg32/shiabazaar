import { requireDashboardPage } from "@/lib/staff-guard";
import DashboardAreaShell from "./DashboardAreaShell";

// Always per-request (role check reads the session cookie) — skips a pointless
// build-time prerender attempt.
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireDashboardPage();
  return <DashboardAreaShell>{children}</DashboardAreaShell>;
}
