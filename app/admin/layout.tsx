"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  Tag, Users, Image, Home, RotateCcw, FolderOpen, BookOpen, Upload, Truck, ClipboardList, BarChart3,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import DashboardShell, { type NavGroup } from "@/components/layout/DashboardShell";

const groups: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/books",      label: "Books",      Icon: BookOpen   },
      { href: "/admin/products",   label: "Products",   Icon: Package    },
      { href: "/admin/categories", label: "Categories", Icon: FolderOpen },
      { href: "/admin/inventory",  label: "Inventory",  Icon: Warehouse  },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/orders",   label: "Orders",   Icon: ShoppingBag },
      { href: "/admin/returns",  label: "Returns",  Icon: RotateCcw   },
      { href: "/admin/coupons",  label: "Coupons",  Icon: Tag         },
      { href: "/admin/shipping", label: "Shipping", Icon: Truck       },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/admin/users", label: "Users", Icon: Users },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/homepage", label: "Homepage", Icon: Home  },
      { href: "/admin/images",   label: "Images",   Icon: Image },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/admin/import", label: "Import / Export", Icon: Upload },
    ],
  },
  {
    label: "Staff areas",
    items: [
      { href: "/desk", label: "Clerk Desk", Icon: ClipboardList },
      { href: "/dashboard", label: "BI Dashboard", Icon: BarChart3 },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <DashboardShell groups={groups} badge="Admin" activeBase="/admin" onSignOut={signOut}>
      {children}
    </DashboardShell>
  );
}
