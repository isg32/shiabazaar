import { requireClerkPage } from "@/lib/staff-guard";
import DeskShell from "./DeskShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireClerkPage();
  return <DeskShell>{children}</DeskShell>;
}
