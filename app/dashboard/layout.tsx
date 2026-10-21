import { requireDashboardPage } from "@/lib/staff-guard";
import DashboardAreaShell from "./DashboardAreaShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireDashboardPage();
  return <DashboardAreaShell>{children}</DashboardAreaShell>;
}
