import { requireClerkPage } from "@/lib/staff-guard";
import DeskShell from "./DeskShell";

// Always per-request (role check reads the session cookie) — skips a pointless
// build-time prerender attempt.
export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireClerkPage();
  return <DeskShell>{children}</DeskShell>;
}
