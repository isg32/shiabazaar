"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  Tag, Users, Image, Home, LogOut, RotateCcw, FolderOpen, BookOpen, Upload, Truck,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";

const groups = [
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
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen flex bg-surface-dark">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col bg-surface-dark border-r border-white/8">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/8">
          <Link href="/" className="flex items-center gap-2.5 text-on-dark">
            <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="25" y="25" width="50" height="50" />
              <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="8" />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Shia Bazaar
              </span>
              <span className="text-[7px] font-medium tracking-[0.2em] text-accent-amber uppercase mt-0.5">
                Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-on-dark-soft/50">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, Icon }) => {
                  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-auto bg-surface-dark-soft">
        {children}
      </main>

    </div>
  );
}
