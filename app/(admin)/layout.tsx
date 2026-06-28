import Link from "next/link";
import {
  LayoutDashboard, Package, ShoppingBag, Boxes,
  Tag, Users, Home, Image, BarChart3, LogOut,
} from "lucide-react";

const adminNav = [
  { href: "/admin",            label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/products",   label: "Products",     icon: Package },
  { href: "/admin/orders",     label: "Orders",       icon: ShoppingBag },
  { href: "/admin/inventory",  label: "Inventory",    icon: Boxes },
  { href: "/admin/coupons",    label: "Coupons",      icon: Tag },
  { href: "/admin/users",      label: "Users",        icon: Users },
  { href: "/admin/homepage",   label: "Homepage",     icon: Home },
  { href: "/admin/images",     label: "Images",       icon: Image },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-surface-soft">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-surface-dark flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="text-on-dark font-display text-lg font-normal" style={{ fontFamily: "var(--font-display)" }}>
            Shia Bazaar
          </Link>
          <p className="text-xs text-on-dark-soft mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 py-3">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated transition-colors"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-xs text-on-dark-soft hover:text-on-dark transition-colors">
            <LogOut size={13} /> Exit to Store
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-canvas border-b border-hairline flex items-center px-6 shrink-0">
          <p className="text-xs text-muted">Logged in as <span className="text-ink font-medium">Admin</span></p>
        </header>
        <div className="flex-1 p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
