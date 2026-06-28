import Link from "next/link";
import { ShoppingBag, Heart, Star, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account" };

const stats = [
  { label: "Total Orders",     value: "12",   icon: ShoppingBag, href: "/account/orders" },
  { label: "Wishlist Items",   value: "5",    icon: Heart,       href: "/account/wishlist" },
  { label: "Reviews Written",  value: "3",    icon: Star,        href: "/account/reviews" },
];

const recentOrders = [
  { id: "SB-20250628-001", date: "28 Jun 2025", status: "Confirmed",  total: 1347 },
  { id: "SB-20250610-088", date: "10 Jun 2025", status: "Delivered",  total: 699  },
  { id: "SB-20250520-044", date: "20 May 2025", status: "Delivered",  total: 849  },
];

const statusColor: Record<string, string> = {
  Confirmed: "text-accent-amber",
  Shipped:   "text-accent-teal",
  Delivered: "text-success",
  Pending:   "text-muted",
};

export default function AccountDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-sm text-ink">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Welcome back, Ali!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="bg-surface-card rounded-xl p-5 flex flex-col gap-3 border border-hairline hover:border-primary/30 transition-colors group">
            <Icon size={18} className="text-primary" />
            <p className="text-2xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-sm font-medium text-ink">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-primary hover:text-primary-active flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-hairline">
          {recentOrders.map((order) => (
            <Link key={order.id} href={`/order/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-canvas transition-colors">
              <div>
                <p className="text-sm font-medium text-ink">{order.id}</p>
                <p className="text-xs text-muted mt-0.5">{order.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-medium ${statusColor[order.status] ?? "text-muted"}`}>{order.status}</p>
                <p className="text-sm font-semibold text-ink mt-0.5">₹{order.total}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
