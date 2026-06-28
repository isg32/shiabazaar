"use client";

import { useState, useMemo } from "react";
import { Plus, Copy, Trash2, Check } from "lucide-react";

type Coupon = {
  code: string; type: string; value: string; minOrder: string;
  uses: number; limit: number | null; expiry: string; status: string;
};

const INIT_COUPONS: Coupon[] = [
  { code: "EID2025",    type: "Percent", value: "20%",  minOrder: "₹500",  uses: 48,  limit: 100,  expiry: "30 Jun 2025", status: "Active"  },
  { code: "MUHARRAM10", type: "Percent", value: "10%",  minOrder: "₹300",  uses: 112, limit: 200,  expiry: "10 Aug 2025", status: "Active"  },
  { code: "FLAT100",    type: "Flat",    value: "₹100", minOrder: "₹800",  uses: 23,  limit: 50,   expiry: "31 Jul 2025", status: "Active"  },
  { code: "WELCOME50",  type: "Flat",    value: "₹50",  minOrder: "₹400",  uses: 50,  limit: 50,   expiry: "15 Jun 2025", status: "Expired" },
  { code: "BOOK15",     type: "Percent", value: "15%",  minOrder: "₹600",  uses: 7,   limit: null, expiry: "31 Dec 2025", status: "Active"  },
  { code: "NEWUSER",    type: "Flat",    value: "₹75",  minOrder: "₹350",  uses: 89,  limit: null, expiry: "31 Dec 2025", status: "Active"  },
];

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(INIT_COUPONS);
  const [copied,  setCopied]  = useState<string | null>(null);

  const [form, setForm] = useState({ code: "", type: "Percent", value: "", minOrder: "", limit: "", expiry: "" });
  const [err,  setErr]  = useState("");

  const active = useMemo(() => coupons.filter(c => c.status === "Active").length, [coupons]);

  function handleSave() {
    const code = form.code.trim().toUpperCase();
    if (!code || !form.value || !form.expiry) { setErr("Code, value, and expiry are required."); return; }
    if (coupons.some(c => c.code === code))    { setErr("That code already exists."); return; }
    const newCoupon: Coupon = {
      code,
      type:     form.type,
      value:    form.type === "Percent" ? `${form.value}%` : `₹${form.value}`,
      minOrder: form.minOrder ? `₹${form.minOrder}` : "—",
      uses:     0,
      limit:    form.limit ? parseInt(form.limit, 10) : null,
      expiry:   form.expiry,
      status:   "Active",
    };
    setCoupons(prev => [newCoupon, ...prev]);
    setForm({ code: "", type: "Percent", value: "", minOrder: "", limit: "", expiry: "" });
    setErr("");
  }

  function deleteCoupon(code: string) {
    setCoupons(prev => prev.filter(c => c.code !== code));
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
            <input
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER25"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary uppercase"
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
            >
              <option>Percent</option>
              <option>Flat</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Value ({form.type === "Percent" ? "%" : "₹"})</label>
            <input
              type="number"
              min="0"
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="10"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Min. Order (₹)</label>
            <input
              type="number"
              min="0"
              value={form.minOrder}
              onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
              placeholder="500"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Usage Limit</label>
            <input
              type="number"
              min="0"
              value={form.limit}
              onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
              placeholder="Unlimited"
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5">Expiry Date</label>
            <input
              type="date"
              value={form.expiry}
              onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
              className="w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
            />
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button
              onClick={handleSave}
              className="h-9 px-6 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center gap-2"
            >
              <Plus size={14} /> Save Coupon
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Code", "Type", "Value", "Min. Order", "Used / Limit", "Expiry", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {coupons.map((c, i) => (
              <tr key={c.code} className={`hover:bg-white/3 transition-colors ${i < coupons.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-on-dark font-medium">{c.code}</span>
                    <button
                      onClick={() => copyCoupon(c.code)}
                      className="text-on-dark-soft hover:text-on-dark transition-colors"
                      title="Copy code"
                    >
                      {copied === c.code ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">{c.type}</td>
                <td className="px-5 py-3.5 text-on-dark font-medium">{c.value}</td>
                <td className="px-5 py-3.5 text-on-dark-soft">{c.minOrder}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: c.limit ? `${Math.min(100, (c.uses / c.limit) * 100)}%` : "30%" }}
                      />
                    </div>
                    <span className="text-xs text-on-dark-soft">{c.uses} / {c.limit ?? "∞"}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">{c.expiry}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${c.status === "Active" ? "text-success" : "text-on-dark-soft"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => deleteCoupon(c.code)}
                    className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
