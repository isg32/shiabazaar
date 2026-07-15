"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Copy, Trash2, Check, Loader2, Zap, Save } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  usageCount: number;
  usageLimit?: number | null;
  expiresAt?: string | null;
  active: boolean;
  autoApply: boolean;
}

const inputCls = "w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary";

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

  // Auto-apply coupon state
  const [autoForm, setAutoForm] = useState({ code: "AUTO10", value: "100", minOrder: "1000" });
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaved,  setAutoSaved]  = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then(r => r.json())
      .then(d => {
        const all: Coupon[] = d.coupons ?? [];
        setCoupons(all);
        setLoading(false);
        const auto = all.find(c => c.autoApply);
        if (auto) {
          setAutoEnabled(auto.active);
          setAutoForm({
            code:     auto.code,
            value:    String(auto.value / 100),
            minOrder: String(auto.minOrder / 100),
          });
        }
      });
  }, []);

  const active = useMemo(() => coupons.filter(c => c.active && !c.autoApply).length, [coupons]);
  const autoCoupon = useMemo(() => coupons.find(c => c.autoApply) ?? null, [coupons]);

  async function saveAutoApply() {
    const code = autoForm.code.trim().toUpperCase();
    if (!code || !autoForm.value || !autoForm.minOrder) return;
    setAutoSaving(true);

    if (autoCoupon) {
      // Update existing
      await fetch(`/api/admin/coupons/${autoCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          value:    Math.round(parseFloat(autoForm.value) * 100),
          minOrder: Math.round(parseFloat(autoForm.minOrder) * 100),
          active:   autoEnabled,
        }),
      });
      setCoupons(prev => prev.map(c =>
        c.id === autoCoupon.id
          ? { ...c, code, value: Math.round(parseFloat(autoForm.value) * 100), minOrder: Math.round(parseFloat(autoForm.minOrder) * 100), active: autoEnabled }
          : c
      ));
    } else {
      // Create new auto-apply coupon
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type:      "flat",
          value:     parseFloat(autoForm.value),
          minOrder:  parseFloat(autoForm.minOrder),
          autoApply: true,
          active:    autoEnabled,
        }),
      });
      const d = await res.json();
      setCoupons(prev => [d.coupon, ...prev]);
    }

    setAutoSaving(false);
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2000);
  }

  async function toggleAutoEnabled() {
    const next = !autoEnabled;
    setAutoEnabled(next);
    if (autoCoupon) {
      await fetch(`/api/admin/coupons/${autoCoupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      setCoupons(prev => prev.map(c => c.id === autoCoupon.id ? { ...c, active: next } : c));
    }
  }

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
          <p className="text-sm text-on-dark-soft mt-0.5">{active} active manual coupons</p>
        </div>
      </div>

      {/* ── Auto-Apply Coupon ── */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-accent-amber" />
            <h2 className="text-sm font-medium text-on-dark">Auto-Apply Coupon</h2>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-accent-amber/15 text-accent-amber">
              Auto
            </span>
          </div>
          {/* Enable / disable toggle */}
          <button
            onClick={toggleAutoEnabled}
            className={`relative w-10 h-5 rounded-full transition-colors ${autoEnabled ? "bg-primary" : "bg-white/15"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoEnabled ? "left-5.5" : "left-0.5"}`} />
          </button>
        </div>
        <p className="text-xs text-on-dark-soft mb-4">
          Automatically applied at checkout when the cart meets the minimum amount. No code entry required.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Coupon Code</label>
            <input
              value={autoForm.code}
              onChange={e => setAutoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="AUTO10"
              className={inputCls + " uppercase"}
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Discount (₹ flat)</label>
            <input
              type="number" min="0"
              value={autoForm.value}
              onChange={e => setAutoForm(f => ({ ...f, value: e.target.value }))}
              placeholder="100"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Min. Cart Amount (₹)</label>
            <input
              type="number" min="0"
              value={autoForm.minOrder}
              onChange={e => setAutoForm(f => ({ ...f, minOrder: e.target.value }))}
              placeholder="1000"
              className={inputCls}
            />
          </div>
        </div>
        <button
          onClick={saveAutoApply}
          disabled={autoSaving}
          className="mt-4 flex items-center gap-2 h-9 px-5 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
        >
          {autoSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {autoSaved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* ── Create manual coupon ── */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-6">
        <h2 className="text-sm font-medium text-on-dark mb-4">New Manual Coupon</h2>
        {err && <p className="text-xs text-error mb-3">{err}</p>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Code</label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER25"
              className={inputCls + " uppercase"} />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className={inputCls}>
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Value ({form.type === "percent" ? "%" : "₹"})</label>
            <input type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="10"
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Min. Order (₹)</label>
            <input type="number" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="500"
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Usage Limit</label>
            <input type="number" min="0" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} placeholder="Unlimited"
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Expiry Date</label>
            <input type="date" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className={inputCls} />
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

      {/* ── Table ── */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Code", "Type", "Value", "Min. Order", "Used / Limit", "Expiry", "Status", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.filter(c => !c.autoApply).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-on-dark-soft">No manual coupons yet.</td>
              </tr>
            ) : coupons.filter(c => !c.autoApply).map((c, i, arr) => (
              <tr key={c.id} className={`hover:bg-white/3 transition-colors ${i < arr.length - 1 ? "border-b border-white/8" : ""}`}>
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
