"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Copy, Trash2, Check, Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;       // percent or paise
  minOrder: number;    // paise
  usageCount: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  active: boolean;
}

function displayValue(c: Coupon) {
  return c.type === "percent" ? `${c.value}%` : `₹${(c.value / 100).toFixed(0)}`;
}
function displayMin(c: Coupon) {
  return c.minOrder ? `₹${(c.minOrder / 100).toFixed(0)}` : "—";
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({ code: "", type: "percent", value: "", minOrder: "", limit: "", expiry: "" });
  const [err,  setErr]  = useState("");

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then(r => r.json())
      .then(d => { setCoupons(d.coupons ?? []); setLoading(false); });
  }, []);

  const active = useMemo(() => coupons.filter(c => c.active).length, [coupons]);

  async function handleSave() {
    const code = form.code.trim().toUpperCase();
    if (!code || !form.value || !form.expiry) { setErr("Code, value, and expiry are required."); return; }
    if (coupons.some(c => c.code === code)) { setErr("That code already exists."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type:       form.type,
        value:      parseFloat(form.value),
        minOrder:   form.minOrder ? parseFloat(form.minOrder) : 0,
        usageLimit: form.limit ? parseInt(form.limit) : null,
        expiresAt:  form.expiry,
      }),
    });
    const d = await res.json();
    setCoupons(prev => [d.coupon, ...prev]);
    setForm({ code: "", type: "percent", value: "", minOrder: "", limit: "", expiry: "" });
    setErr("");
    setSaving(false);
  }

  async function deleteCoupon(id: string) {
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  function copyCoupon(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Coupons</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{active} active coupons</p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-6">
        <h2 className="text-sm font-medium text-on-dark mb-4">New Coupon</h2>
        {err && <p className="text-xs text-error mb-3">{err}</p>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Code</label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary uppercase" />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary">
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Value ({form.type === "percent" ? "%" : "₹"})</label>
            <input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="10"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Min. Order (₹)</label>
            <input type="number" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="500"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Usage Limit</label>
            <input type="number" min="0" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} placeholder="Unlimited"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Expiry Date</label>
            <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary" />
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button onClick={handleSave} disabled={saving}
              className="h-9 px-6 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Save Coupon
            </button>
          </div>
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
              {["Code", "Type", "Value", "Min. Order", "Used / Limit", "Expiry", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-on-dark-soft">No coupons yet.</td>
              </tr>
            ) : coupons.map((c, i) => (
              <tr key={c.id} className={`hover:bg-white/3 transition-colors ${i < coupons.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-on-dark font-medium">{c.code}</span>
                    <button onClick={() => copyCoupon(c.code)} className="text-on-dark-soft hover:text-on-dark transition-colors">
                      {copied === c.code ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft capitalize">{c.type}</td>
                <td className="px-5 py-3.5 text-on-dark font-medium">{displayValue(c)}</td>
                <td className="px-5 py-3.5 text-on-dark-soft">{displayMin(c)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full"
                        style={{ width: c.usageLimit ? `${Math.min(100, (c.usageCount / c.usageLimit) * 100)}%` : "30%" }} />
                    </div>
                    <span className="text-xs text-on-dark-soft">{c.usageCount} / {c.usageLimit ?? "∞"}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${c.active ? "text-success" : "text-on-dark-soft"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => deleteCoupon(c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
