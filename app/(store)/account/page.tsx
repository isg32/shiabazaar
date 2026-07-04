"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Heart, Star, ArrowRight, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";

const STATUS_COLOR: Record<string, string> = {
  pending:    "text-muted",
  processing: "text-accent-amber",
  shipped:    "text-accent-teal",
  delivered:  "text-success",
  cancelled:  "text-error",
};

function orderRef(id: string) {
  return `#SB-${id.slice(0, 8).toUpperCase()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountDashboard() {
  const session = authClient.useSession();
  const [stats, setStats]   = useState<{ orders: number; wishlist: number; reviews: number } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/account/stats").then(r => r.json()),
      fetch("/api/account/orders").then(r => r.json()),
    ]).then(([s, o]) => {
      setStats(s);
      setOrders((o.orders ?? []).slice(0, 3));
      setLoading(false);
    });
  }, []);

  const firstName = session.data?.user?.name?.split(" ")[0] ?? "";

  const statCards = [
    { label: "Total Orders",    value: stats?.orders   ?? "—", icon: ShoppingBag, href: "/account/orders"  },
    { label: "Wishlist Items",  value: stats?.wishlist ?? "—", icon: Heart,       href: "/account/wishlist" },
    { label: "Reviews Written", value: stats?.reviews  ?? "—", icon: Star,        href: "/account/reviews"  },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-sm text-ink">Dashboard</h1>
        {firstName && <p className="text-muted text-sm mt-1">Welcome back, {firstName}!</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}
            className="bg-surface-card rounded-xl p-5 flex flex-col gap-3 border border-hairline hover:border-primary/30 transition-colors group">
            <Icon size={18} className="text-primary" />
            <p className="text-2xl font-semibold text-ink">
              {loading ? <span className="inline-block w-6 h-5 bg-surface-soft rounded animate-pulse" /> : value}
            </p>
            <p className="text-xs text-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-sm font-medium text-ink">Recent Orders</h2>
          <Link href="/account/orders" className="text-xs text-primary hover:text-primary-active flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </div>
        ) : orders.length === 0 ? (
          <p className="px-6 py-10 text-sm text-muted text-center">No orders yet.</p>
        ) : (
          <div className="divide-y divide-hairline">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-canvas transition-colors">
                <div>
                  <p className="text-sm font-medium text-ink">{orderRef(order.id)}</p>
                  <p className="text-xs text-muted mt-0.5">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-medium capitalize ${STATUS_COLOR[order.status] ?? "text-muted"}`}>
                    {order.status}
                  </p>
                  <p className="text-sm font-semibold text-ink mt-0.5">₹{(order.total / 100).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
