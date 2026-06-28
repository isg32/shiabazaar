"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Warehouse,
  Tag, Users, Image, Home, LogOut,
} from "lucide-react";

const nav = [
  { href: "/admin",           label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products",  label: "Products",  Icon: Package         },
  { href: "/admin/orders",    label: "Orders",    Icon: ShoppingBag     },
  { href: "/admin/inventory", label: "Inventory", Icon: Warehouse       },
  { href: "/admin/coupons",   label: "Coupons",   Icon: Tag             },
  { href: "/admin/users",     label: "Users",     Icon: Users           },
  { href: "/admin/homepage",  label: "Homepage",  Icon: Home            },
  { href: "/admin/images",    label: "Images",    Icon: Image           },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {nav.map(({ href, label, Icon }) => {
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
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/8">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </Link>
        </div>

      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-auto bg-surface-dark-soft">
        {children}
      </main>

    </div>
  );
}
