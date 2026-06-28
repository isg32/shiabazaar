import { ShoppingBag, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Dashboard" };

const stats = [
  { label: "Revenue this month", value: "₹1,24,580", delta: "+8.2%",  up: true,  Icon: TrendingUp  },
  { label: "Total orders",       value: "142",        delta: "+12",    up: true,  Icon: ShoppingBag },
  { label: "Products",           value: "68",         delta: "4 low",  up: false, Icon: Package     },
  { label: "Customers",          value: "891",        delta: "+34",    up: true,  Icon: Users       },
];

const recentOrders = [
  { id: "ORD-1041", customer: "Ahmed K.",    product: "Nahjul Balagha",          status: "Delivered",  amount: "₹620",   date: "28 Jun" },
  { id: "ORD-1040", customer: "Fatima R.",   product: "Tafseer e Namoona Vol 1", status: "Shipped",    amount: "₹480",   date: "27 Jun" },
  { id: "ORD-1039", customer: "Hussain M.",  product: "Alam Panja (Brass)",      status: "Processing", amount: "₹1,200", date: "27 Jun" },
  { id: "ORD-1038", customer: "Zainab A.",   product: "Prayer Mat — Ladies",     status: "Delivered",  amount: "₹350",   date: "26 Jun" },
  { id: "ORD-1037", customer: "Ali H.",      product: "Mashak Brass Small",      status: "Cancelled",  amount: "₹890",   date: "25 Jun" },
];

const topProducts = [
  { name: "Nahjul Balagha",          sold: 38, revenue: "₹23,560" },
  { name: "Tafseer e Namoona Vol 1", sold: 31, revenue: "₹14,880" },
  { name: "Alam Panja (Brass)",       sold: 24, revenue: "₹28,800" },
  { name: "Mashak Brass Small",       sold: 19, revenue: "₹16,910" },
  { name: "Prayer Mat — Ladies",      sold: 17, revenue: "₹5,950"  },
];

const lowStock = [
  { name: "Alam Patka (Small)",   stock: 2, type: "Gift"  },
  { name: "Tafseer e Saafi Vol 3",stock: 3, type: "Book"  },
  { name: "Gents Kurta — White",  stock: 1, type: "Gents" },
];

const statusColor: Record<string, string> = {
  Delivered:  "text-success",
  Shipped:    "text-accent-amber",
  Processing: "text-on-dark-soft",
  Cancelled:  "text-error",
};

export default function AdminDashboard() {
  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Dashboard</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">Saturday, 28 June 2025</p>
        </div>
        <Link href="/admin/orders" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <ShoppingBag size={14} /> View Orders
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, delta, up, Icon }) => (
          <div key={label} className="bg-surface-dark-elevated rounded-xl p-5 border border-white/8">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon size={15} className="text-on-dark-soft" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-success" : "text-error"}`}>
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {delta}
              </span>
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Order", "Customer", "Status", "Date", "Amount"].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < recentOrders.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-6 py-3 font-mono text-xs text-on-dark-soft">{o.id}</td>
                  <td className="px-6 py-3 text-on-dark">{o.customer}</td>
                  <td className={`px-6 py-3 text-xs font-medium ${statusColor[o.status]}`}>{o.status}</td>
                  <td className="px-6 py-3 text-xs text-on-dark-soft">{o.date}</td>
                  <td className="px-6 py-3 text-on-dark font-medium">{o.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Top products */}
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8">
              <h2 className="text-sm font-medium text-on-dark">Top Products</h2>
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs text-on-dark-soft w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-dark truncate">{p.name}</p>
                    <p className="text-[11px] text-on-dark-soft">{p.sold} sold · {p.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-on-dark">Low Stock</h2>
              <Clock size={13} className="text-error" />
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {lowStock.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-on-dark">{p.name}</p>
                    <p className="text-[11px] text-on-dark-soft">{p.type}</p>
                  </div>
                  <span className="text-xs font-medium text-error">{p.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
