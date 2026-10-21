import { requireAdminPage } from "@/lib/staff-guard";
import AdminShell from "./AdminShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <AdminShell>{children}</AdminShell>;
}
