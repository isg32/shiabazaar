"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, X } from "lucide-react";

type Vendor = {
  id: string;
  name: string;
  code: string | null;
  contactName: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  creditLimit: number;
  balance: number;
  active: boolean;
  _count: { orders: number; payments: number };
};

const EMPTY = { name: "", contactName: "", phone: "", email: "", city: "", state: "", creditLimit: "", paymentTermsDays: "" };

export default function DeskVendors() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/desk/vendors")
      .then((r) => r.json())
      .then((d) => { setVendors(d.vendors ?? []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      (v.code ?? "").toLowerCase().includes(q) ||
      (v.city ?? "").toLowerCase().includes(q) ||
      (v.contactName ?? "").toLowerCase().includes(q)
    );
  }, [vendors, query]);

  const totalOutstanding = vendors.filter((v) => v.active).reduce((sum, v) => sum + Math.max(v.balance, 0), 0);

  async function create() {
    setError(null);
    if (!form.name.trim()) { setError("Vendor name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/desk/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not create the vendor.");
      return;
    }
    setForm({ ...EMPTY });
    setAdding(false);
    load();
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Vendors</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">
            Book-credit accounts · ₹{(totalOutstanding / 100).toFixed(0)} outstanding across active vendors
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors"
        >
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? "Close" : "Add Vendor"}
        </button>
      </div>

      {adding && (
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5 mb-5">
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              ["name", "Vendor name *"],
              ["contactName", "Contact person"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["city", "City"],
              ["state", "State"],
              ["creditLimit", "Credit limit (₹, 0 = none)"],
              ["paymentTermsDays", "Payment terms (days, blank = default)"],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-xs text-on-dark-soft">{label}</span>
                <input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  type={field === "creditLimit" || field === "paymentTermsDays" ? "number" : "text"}
                  className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-on-dark-soft mt-3">A vendor code (VEN-0001, …) is assigned automatically.</p>
          {error && <p className="text-sm text-error mt-3">{error}</p>}
          <div className="flex justify-end mt-4">
            <button
              onClick={create} disabled={saving}
              className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create vendor"}
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code, city or contact…"
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
                {["Vendor", "Contact", "Outstanding", "Credit limit", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {vendors.length === 0 ? "No vendors yet." : "No vendors match your search."}
                </td></tr>
              ) : filtered.map((v, i) => {
                const nearLimit = v.creditLimit > 0 && v.balance >= v.creditLimit * 0.9;
                return (
                  <tr
                    key={v.id}
                    onClick={() => router.push(`/desk/vendors/${v.id}`)}
                    className={`hover:bg-white/3 transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-on-dark font-medium">{v.name}</p>
                      {v.code && <p className="text-[11px] font-mono text-on-dark-soft">{v.code}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      {v.contactName ?? "—"}{v.phone ? ` · ${v.phone}` : ""}
                      {(v.city || v.state) && <p className="text-[11px] text-on-dark-soft/70">{[v.city, v.state].filter(Boolean).join(", ")}</p>}
                    </td>
                    <td className={`px-5 py-3.5 font-medium ${v.balance > 0 ? (nearLimit ? "text-accent-amber" : "text-error") : v.balance < 0 ? "text-success" : "text-on-dark-soft"}`}>
                      {v.balance < 0 ? `₹${(-v.balance / 100).toFixed(0)} advance` : `₹${(v.balance / 100).toFixed(0)}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      {v.creditLimit > 0 ? `₹${(v.creditLimit / 100).toFixed(0)}` : "none"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${v.active ? "bg-success/10 text-success" : "bg-white/5 text-on-dark-soft"}`}>
                        {v.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {vendors.length} vendors</span>
        </div>
      </div>
    </div>
  );
}
