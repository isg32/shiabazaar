import { ShoppingBag, Package, Users, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Dashboard" };

function fmtRupees(paise: number) {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

const STATUS_COLOR: Record<string, string> = {
  delivered:  "text-success",
  shipped:    "text-accent-amber",
  processing: "text-on-dark-soft",
  pending:    "text-on-dark-soft",
  cancelled:  "text-error",
};

export default async function AdminDashboard() {
  const [orderCount, productCount, userCount, revenueAgg, recentOrders, topItemsRaw, outOfStock] =
    await Promise.all([
      db.order.count(),
      db.product.count(),
      db.user.count(),
      db.order.aggregate({ _sum: { total: true }, where: { status: { not: "cancelled" } } }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user:  { select: { name: true, email: true } },
          items: { take: 1, select: { title: true } },
        },
      }),
      db.orderItem.groupBy({
        by:        ["productId"],
        _sum:      { qty: true },
        orderBy:   { _sum: { qty: "desc" } },
        take:      5,
      }),
      db.product.findMany({
        where:  { inStock: false },
        select: { title: true, type: true },
        take:   5,
      }),
    ]);

  // Fetch titles for top items
  const topIds    = topItemsRaw.map(r => r.productId);
  const topTitles = topIds.length
    ? await db.product.findMany({ where: { id: { in: topIds } }, select: { id: true, title: true } })
    : [];
  const topProducts = topItemsRaw.map(r => ({
    title: topTitles.find(p => p.id === r.productId)?.title ?? "—",
    sold:  r._sum.qty ?? 0,
  }));

  const revenue = revenueAgg._sum.total ?? 0;

  const stats = [
    { label: "Total Revenue",  value: fmtRupees(revenue),      Icon: TrendingUp  },
    { label: "Total Orders",   value: String(orderCount),       Icon: ShoppingBag },
    { label: "Products",       value: String(productCount),     Icon: Package     },
    { label: "Customers",      value: String(userCount),        Icon: Users       },
  ];

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Dashboard</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/orders" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <ShoppingBag size={14} /> View Orders
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="bg-surface-dark-elevated rounded-xl p-5 border border-white/8">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
              <Icon size={15} className="text-on-dark-soft" />
            </div>
            <p className="text-xl font-semibold text-on-dark">{value}</p>
            <p className="text-xs text-on-dark-soft mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-medium text-on-dark">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:text-primary-active transition-colors">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-on-dark-soft text-center py-8">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Order", "Customer", "Item", "Status", "Date", "Amount"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < recentOrders.length - 1 ? "border-b border-white/8" : ""}`}>
                    <td className="px-6 py-3 font-mono text-xs text-on-dark-soft">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-on-dark">{o.user?.name ?? o.user?.email ?? "Guest"}</td>
                    <td className="px-6 py-3 text-xs text-on-dark-soft truncate max-w-[140px]">{o.items[0]?.title ?? "—"}</td>
                    <td className={`px-6 py-3 text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? "text-on-dark-soft"}`}>{o.status}</td>
                    <td className="px-6 py-3 text-xs text-on-dark-soft">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-6 py-3 text-on-dark font-medium">₹{(o.total / 100).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Top products */}
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-medium text-on-dark">Top Products</h2>
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {topProducts.length === 0 ? (
                <p className="text-xs text-on-dark-soft py-2">No sales data yet.</p>
              ) : topProducts.map((p, i) => (
                <div key={p.title} className="flex items-center gap-3">
                  <span className="text-xs text-on-dark-soft w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-dark truncate">{p.title}</p>
                    <p className="text-[11px] text-on-dark-soft">{p.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Out of stock */}
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-on-dark">Out of Stock</h2>
              <Clock size={13} className="text-error" />
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {outOfStock.length === 0 ? (
                <p className="text-xs text-success py-2">All products in stock.</p>
              ) : outOfStock.map(p => (
                <div key={p.title} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-dark">{p.title}</p>
                    <p className="text-[11px] text-on-dark-soft capitalize">{p.type}</p>
                  </div>
                  <span className="text-xs font-medium text-error">Out of stock</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
