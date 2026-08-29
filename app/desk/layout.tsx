"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, School, Warehouse, Globe } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import DashboardShell, { type NavGroup } from "@/components/layout/DashboardShell";

const groups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/desk", label: "Dashboard", Icon: LayoutDashboard },
    ],
  },
  {
    label: "Offline",
    items: [
      { href: "/desk/sales", label: "Sales", Icon: ShoppingBag },
    ],
  },
  {
    label: "Schools",
    items: [
      { href: "/desk/schools", label: "Schools", Icon: School },
    ],
  },
  {
    label: "Stock",
    items: [
      { href: "/desk/inventory", label: "Inventory", Icon: Warehouse },
    ],
  },
  {
    label: "Online",
    items: [
      { href: "/desk/online", label: "Orders", Icon: Globe },
    ],
  },
];

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <DashboardShell groups={groups} badge="Desk" activeBase="/desk" onSignOut={signOut}>
      {children}
    </DashboardShell>
  );
}
