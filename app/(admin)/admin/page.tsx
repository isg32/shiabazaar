import { ShoppingBag, Package, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Dashboard" };

const kpis = [
  { label: "Total Revenue",  value: "₹1,24,580", change: "+18%", icon: TrendingUp, up: true },
  { label: "Orders Today",   value: "14",         change: "+3",   icon: ShoppingBag, up: true },
  { label: "Total Products", value: "237",        change: "+5",   icon: Package, up: true },
  { label: "Active Users",   value: "1,089",      change: "+42",  icon: Users, up: true },
];

const recentOrders = [
  { id: "SB-20250628-014", customer: "Fatima R.", total: 699,  status: "Confirmed" },
  { id: "SB-20250628-013", customer: "Ahmed K.",  total: 1347, status: "Confirmed" },
  { id: "SB-20250628-012", customer: "Zainab M.", total: 299,  status: "Shipped"   },
  { id: "SB-20250627-011", customer: "Hussain M.",total: 849,  status: "Delivered" },
  { id: "SB-20250627-010", customer: "Ali S.",    total: 549,  status: "Delivered" },
];

const topProducts = [
  { title: "Nahjul Balagha",           sold: 89, revenue: 62211 },
  { title: "Mafatih Al-Jinan",         sold: 74, revenue: 40626 },
  { title: "Ayatul Kursi Night Lamp",  sold: 61, revenue: 51789 },
  { title: "Quran with Tajweed Rules", sold: 57, revenue: 45543 },
  { title: "Ya Hussain Ceramic Mug",   sold: 43, revenue: 12857 },
];

const statusColor: Record<string, string> = {
  Confirmed: "text-accent-amber bg-accent-amber/10",
  Shipped:   "text-accent-teal bg-accent-teal/10",
  Delivered: "text-success bg-success/10",
};

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-ink">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, change, icon: Icon, up }) => (
          <div key={label} className="bg-canvas rounded-xl p-5 border border-hairline">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
              <Icon size={16} className="text-muted" />
            </div>
            <p className="text-2xl font-semibold text-ink">{value}</p>
            <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? "text-success" : "text-error"}`}>
              <ArrowUpRight size={11} />{change} this month
            </p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="xl:col-span-2 bg-canvas rounded-xl border border-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <h2 className="text-sm font-medium text-ink">Recent Orders</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline">
                {["Order ID","Customer","Total","Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-soft transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-ink">{o.id}</td>
                  <td className="px-5 py-3 text-body">{o.customer}</td>
                  <td className="px-5 py-3 font-medium text-ink">₹{o.total}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[o.status] ?? "text-muted bg-surface-soft"}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline">
            <h2 className="text-sm font-medium text-ink">Top Products</h2>
          </div>
          <div className="divide-y divide-hairline">
            {topProducts.map((p, i) => (
              <div key={p.title} className="flex items-center gap-3 px-5 py-3">
                <span className="text-xs font-medium text-muted w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{p.title}</p>
                  <p className="text-xs text-muted">{p.sold} sold</p>
                </div>
                <p className="text-sm font-medium text-ink shrink-0">₹{p.revenue.toLocaleString("en-IN")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
