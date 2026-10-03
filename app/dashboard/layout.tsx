"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import DashboardShell, { type NavGroup } from "@/components/layout/DashboardShell";

// Sections are added here as they are built (see the TM BI spec navigation).
const groups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
    ],
  },
];

export default function BiDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <DashboardShell groups={groups} badge="Dashboard" activeBase="/dashboard" onSignOut={signOut}>
      {children}
    </DashboardShell>
  );
}
