"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, ExternalLink, ChevronDown, Check, Loader2 } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;       // paise
  createdAt: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  user?: { name?: string | null; email: string } | null;
  items: { qty: number }[];
}

const STATUS_STYLES: Record<string, string> = {
  delivered:  "bg-success/12 text-success",
  shipped:    "bg-accent-amber/15 text-accent-amber",
  processing: "bg-white/8 text-on-dark-soft",
  pending:    "bg-white/8 text-on-dark-soft",
  cancelled:  "bg-error/10 text-error",
};
const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];
const TABS = ["All", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [query,      setQuery]      = useState("");
  const [activeTab,  setActiveTab]  = useState("All");
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [openDrop,   setOpenDrop]   = useState<string | null>(null);
  const [trackInput, setTrackInput] = useState<Record<string, string>>({});
  const [editTrack,  setEditTrack]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o =>
      (activeTab === "All" || o.status === activeTab) &&
      (!q || o.id.toLowerCase().includes(q) ||
        o.user?.email.toLowerCase().includes(q) ||
        (o.user?.name ?? "").toLowerCase().includes(q))
    );
  }, [orders, query, activeTab]);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setOpenDrop(null);
  }

  async function saveTracking(id: string) {
    const val = (trackInput[id] ?? "").trim();
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: val }),
    });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, trackingNumber: val } : o));
    setEditTrack(null);
  }

  return (
    <div className="px-8 py-8 text-on-dark" onClick={() => setOpenDrop(null)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Orders</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{filtered.length} of {orders.length} orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-0 border-b border-white/8 mb-5 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setActiveTab(t); setQuery(""); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap capitalize border-b-2 transition-colors ${activeTab === t ? "border-primary text-primary" : "border-transparent text-on-dark-soft hover:text-on-dark"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by order ID or customer…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Tracking", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {orders.length === 0 ? "No orders yet." : "No orders match your search."}
                </td>
              </tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">{o.id.slice(0, 8)}</td>
                <td className="px-5 py-3.5">
                  <p className="text-on-dark font-medium">{o.user?.name ?? "Guest"}</p>
                  <p className="text-[11px] text-on-dark-soft">{o.user?.email ?? ""}</p>
                </td>
                <td className="px-5 py-3.5 text-on-dark-soft text-center">{o.items.reduce((s, item) => s + item.qty, 0)}</td>
                <td className="px-5 py-3.5 text-on-dark font-medium">₹{(o.total / 100).toFixed(0)}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[o.status] ?? "bg-white/8 text-on-dark-soft"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </td>
                <td className="px-5 py-3.5">
                  {editTrack === o.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={trackInput[o.id] ?? ""}
                        onChange={e => setTrackInput(prev => ({ ...prev, [o.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === "Enter") saveTracking(o.id); if (e.key === "Escape") setEditTrack(null); }}
                        placeholder="Tracking #"
                        className="w-28 h-7 px-2 text-xs bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                      />
                      <button onClick={() => saveTracking(o.id)} className="w-6 h-6 flex items-center justify-center rounded bg-success/15 text-success hover:bg-success/25 transition-colors">
                        <Check size={11} />
                      </button>
                    </div>
                  ) : o.trackingNumber ? (
                    <button
                      onClick={() => { setEditTrack(o.id); setTrackInput(prev => ({ ...prev, [o.id]: o.trackingNumber ?? "" })); }}
                      className="flex items-center gap-1 text-xs text-accent-amber font-mono hover:text-amber-300 transition-colors"
                    >
                      {o.trackingNumber} <ExternalLink size={10} />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setEditTrack(o.id); setTrackInput(prev => ({ ...prev, [o.id]: "" })); }}
                      className="text-xs text-on-dark-soft underline hover:text-on-dark"
                    >
                      Add
                    </button>
                  )}
                </td>
                <td className="px-5 py-3.5 relative">
                  <button
                    onClick={e => { e.stopPropagation(); setOpenDrop(openDrop === o.id ? null : o.id); }}
                    className="flex items-center gap-1 text-xs text-on-dark-soft bg-white/6 hover:bg-white/10 px-2.5 py-1 rounded transition-colors"
                  >
                    Status <ChevronDown size={11} />
                  </button>
                  {openDrop === o.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute right-4 top-9 z-20 bg-surface-dark-elevated border border-white/12 rounded-lg shadow-xl py-1 min-w-[140px]"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => setStatus(o.id, s)}
                          className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors flex items-center justify-between gap-2 ${o.status === s ? "text-primary" : "text-on-dark-soft hover:text-on-dark hover:bg-white/5"}`}
                        >
                          {s}
                          {o.status === s && <Check size={11} />}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
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
