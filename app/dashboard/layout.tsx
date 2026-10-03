"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Store, Users, Receipt, Package, FolderTree, Wallet, Hourglass, Bell, Settings,
  Globe, School, Truck, UserRound, BadgeCheck, HandCoins, Percent, Undo2, Trophy, FileSpreadsheet,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import DashboardShell, { type NavGroup } from "@/components/layout/DashboardShell";

const groups: NavGroup[] = [
  { label: null, items: [{ href: "/dashboard", label: "Overview", Icon: LayoutDashboard }] },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/sales", label: "Sales analytics", Icon: TrendingUp },
      { href: "/dashboard/online", label: "Online sales", Icon: Globe },
      { href: "/dashboard/store", label: "Store sales", Icon: Store },
      { href: "/dashboard/channels", label: "Online vs store", Icon: BadgeCheck },
      { href: "/dashboard/buyers", label: "Buyer types", Icon: Users },
      { href: "/dashboard/transactions", label: "Transactions", Icon: Receipt },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/dashboard/schools", label: "Schools", Icon: School },
      { href: "/dashboard/vendors", label: "Vendors", Icon: Truck },
      { href: "/dashboard/customers", label: "Customers", Icon: UserRound },
      { href: "/dashboard/staff", label: "Staff", Icon: Users },
    ],
  },
  {
    label: "Products",
    items: [
      { href: "/dashboard/products", label: "Products", Icon: Package },
      { href: "/dashboard/categories", label: "Categories", Icon: FolderTree },
      { href: "/dashboard/discounts", label: "Discounts", Icon: Percent },
      { href: "/dashboard/returns", label: "Returns", Icon: Undo2 },
      { href: "/dashboard/rankings", label: "Top & bottom", Icon: Trophy },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/dashboard/collections", label: "Collections", Icon: HandCoins },
      { href: "/dashboard/credit", label: "Credit monitoring", Icon: Wallet },
      { href: "/dashboard/ageing", label: "Ageing", Icon: Hourglass },
      { href: "/dashboard/alerts", label: "Alerts", Icon: Bell },
    ],
  },
  {
    label: null,
    items: [
      { href: "/dashboard/reports", label: "Reports", Icon: FileSpreadsheet },
      { href: "/dashboard/settings", label: "Settings", Icon: Settings },
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
