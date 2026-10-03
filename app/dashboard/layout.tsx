"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Store, Users, Receipt, Package, FolderTree, Wallet, Hourglass, Bell, Settings,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import DashboardShell, { type NavGroup } from "@/components/layout/DashboardShell";

const groups: NavGroup[] = [
  { label: null, items: [{ href: "/dashboard", label: "Overview", Icon: LayoutDashboard }] },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/sales", label: "Sales analytics", Icon: TrendingUp },
      { href: "/dashboard/channels", label: "Online vs store", Icon: Store },
      { href: "/dashboard/buyers", label: "Buyer types", Icon: Users },
      { href: "/dashboard/transactions", label: "Transactions", Icon: Receipt },
    ],
  },
  {
    label: "Products",
    items: [
      { href: "/dashboard/products", label: "Products", Icon: Package },
      { href: "/dashboard/categories", label: "Categories", Icon: FolderTree },
    ],
  },
  {
    label: "Credit",
    items: [
      { href: "/dashboard/credit", label: "Credit monitoring", Icon: Wallet },
      { href: "/dashboard/ageing", label: "Ageing", Icon: Hourglass },
      { href: "/dashboard/alerts", label: "Alerts", Icon: Bell },
    ],
  },
  { label: null, items: [{ href: "/dashboard/settings", label: "Settings", Icon: Settings }] },
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
