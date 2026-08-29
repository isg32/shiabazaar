"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, Info } from "lucide-react";

type Item = { id: string; title: string; qty: number; price: number; product: { title: string } | null };
type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: { name: string | null; email: string } | null;
  address: { name: string; phone: string } | null;
  items: Item[];
};

const STATUS_COLOR: Record<string, string> = {
  delivered:  "text-success",
  shipped:    "text-accent-amber",
  processing: "text-on-dark-soft",
  pending:    "text-on-dark-soft",
  cancelled:  "text-error",
};

export default function DeskOnlineOrders() {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");

  useEffect(() => {
    fetch("/api/desk/online-orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      (o.user?.email ?? "").toLowerCase().includes(q) ||
      (o.user?.name ?? o.address?.name ?? "").toLowerCase().includes(q)
    );
  }, [orders, query]);

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-dark">Online Orders</h1>
        <p className="text-sm text-on-dark-soft mt-0.5">Read-only view of storefront orders</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 mb-5 bg-white/5 border border-white/8 rounded-lg">
        <Info size={14} className="text-on-dark-soft shrink-0" />
        <span className="text-xs text-on-dark-soft">Online orders are managed by the store admin. This view is for reference only.</span>
      </div>

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by order ID, customer name or email…"
          className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Order", "Customer", "Items", "Status", "Date", "Total"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {orders.length === 0 ? "No online orders yet." : "No orders match your search."}
                </td></tr>
              ) : filtered.map((o, i) => (
                <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-3.5 text-on-dark">
                    {o.user?.name ?? o.address?.name ?? o.user?.email ?? "Guest"}
                    {o.user?.email && <span className="block text-[11px] text-on-dark-soft">{o.user.email}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-on-dark-soft">{o.items.reduce((s, it) => s + it.qty, 0)}</td>
                  <td className={`px-5 py-3.5 text-xs font-medium capitalize ${STATUS_COLOR[o.status] ?? "text-on-dark-soft"}`}>{o.status}</td>
                  <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-on-dark font-medium">₹{(o.total / 100).toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {orders.length} orders</span>
        </div>
      </div>
    </div>
  );
}
