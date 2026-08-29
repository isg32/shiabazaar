"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Loader2, Plus, Pencil, Ban } from "lucide-react";

type Item = { id: string; title: string; qty: number; price: number };
type Sale = {
  id: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  items: Item[];
};

export default function DeskSales() {
  const [sales,   setSales]   = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [busy,    setBusy]    = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/desk/sales")
      .then((r) => r.json())
      .then((d) => { setSales(d.orders ?? []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter((s) =>
      s.id.toLowerCase().includes(q) ||
      s.items.some((it) => it.title.toLowerCase().includes(q)) ||
      (s.notes ?? "").toLowerCase().includes(q)
    );
  }, [sales, query]);

  async function cancel(id: string) {
    if (!confirm("Cancel this sale? Stock will be returned and the entry kept in history.")) return;
    setBusy(id);
    const res = await fetch(`/api/desk/sales/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Could not cancel.");
      return;
    }
    load();
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Offline Sales</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">Walk-in sales recorded at the desk</p>
        </div>
        <Link href="/desk/sales/new" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <Plus size={14} /> New Sale
        </Link>
      </div>

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ref, item or customer…"
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
                {["Ref", "Items", "Payment", "Total", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {sales.length === 0 ? "No offline sales yet." : "No sales match your search."}
                </td></tr>
              ) : filtered.map((s, i) => {
                const cancelled = s.status === "cancelled";
                const count = s.items.reduce((n, it) => n + it.qty, 0);
                return (
                  <tr key={s.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""} ${cancelled ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">#{s.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      <span className="text-on-dark">{count}</span>
                      <span className="text-on-dark-soft/70"> · {s.items[0]?.title ?? "—"}{s.items.length > 1 ? ` +${s.items.length - 1}` : ""}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft capitalize">{(s.paymentMethod ?? "—").replace(/_/g, " ")}</td>
                    <td className={`px-5 py-3.5 font-medium ${cancelled ? "line-through text-on-dark-soft" : "text-on-dark"}`}>₹{(s.total / 100).toFixed(0)}</td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      {cancelled ? (
                        <span className="text-[11px] text-error font-medium">Cancelled</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Link href={`/desk/sales/${s.id}/edit`}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/5 text-on-dark-soft hover:bg-white/10 transition-colors">
                            <Pencil size={11} /> Edit
                          </Link>
                          <button onClick={() => cancel(s.id)} disabled={busy === s.id}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-error/10 text-error hover:bg-error/20 transition-colors disabled:opacity-50">
                            <Ban size={11} /> Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {sales.length} sales</span>
        </div>
      </div>
    </div>
  );
}
