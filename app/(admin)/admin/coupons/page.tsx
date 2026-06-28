import { Plus, Trash2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Coupons" };

const coupons = [
  { code: "SHIA10",     type: "percent", value: 10, minOrder: 500,  uses: 142, limit: 500,  expiry: "31 Dec 2025", active: true  },
  { code: "MUHARRAM20", type: "percent", value: 20, minOrder: 1000, uses: 88,  limit: 200,  expiry: "20 Aug 2025", active: true  },
  { code: "FLAT50",     type: "flat",    value: 50, minOrder: 300,  uses: 200, limit: 200,  expiry: "30 Jun 2025", active: false },
  { code: "WELCOME",    type: "percent", value: 15, minOrder: 0,    uses: 312, limit: 1000, expiry: "31 Dec 2025", active: true  },
];

export default function AdminCouponsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Coupons</h1>
        <button className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
          <Plus size={15} /> Create Coupon
        </button>
      </div>

      {/* Create form */}
      <div className="bg-surface-card rounded-xl p-6 border border-hairline">
        <h2 className="text-sm font-medium text-ink mb-4">New Coupon</h2>
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <input placeholder="Code (e.g. EID20)" className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary" />
          <select className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink focus:outline-none focus:border-primary">
            <option value="percent">% Discount</option>
            <option value="flat">Flat ₹ Off</option>
          </select>
          <input type="number" placeholder="Value (e.g. 10)" className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary" />
          <input type="number" placeholder="Min order ₹" className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary" />
          <input type="number" placeholder="Usage limit" className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary" />
          <input type="date" className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink focus:outline-none focus:border-primary" />
        </div>
        <button className="mt-3 h-9 px-5 bg-primary text-on-primary text-xs font-medium rounded-md hover:bg-primary-active transition-colors">
          Save Coupon
        </button>
      </div>

      {/* Table */}
      <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {["Code","Type","Value","Min Order","Used / Limit","Expiry","Active","Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {coupons.map((c) => (
              <tr key={c.code} className="hover:bg-surface-soft transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-ink">{c.code}</td>
                <td className="px-4 py-3 text-xs text-muted capitalize">{c.type}</td>
                <td className="px-4 py-3 text-ink font-medium text-xs">{c.type === "percent" ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-4 py-3 text-xs text-muted">{c.minOrder > 0 ? `₹${c.minOrder}` : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted">{c.uses} / {c.limit}</td>
                <td className="px-4 py-3 text-xs text-muted">{c.expiry}</td>
                <td className="px-4 py-3">
                  <div className={`w-8 h-4 rounded-full transition-colors ${c.active ? "bg-success" : "bg-hairline"} relative cursor-pointer`}>
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${c.active ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-error hover:bg-error/10 transition-colors">
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
