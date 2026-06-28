import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Orders" };

const orders = [
  { id: "SB-20250628-014", customer: "Fatima R.",  date: "28 Jun 2025", items: 2, total: 699,  status: "Confirmed", tracking: "" },
  { id: "SB-20250628-013", customer: "Ahmed K.",   date: "28 Jun 2025", items: 3, total: 1347, status: "Confirmed", tracking: "" },
  { id: "SB-20250628-012", customer: "Zainab M.",  date: "28 Jun 2025", items: 1, total: 299,  status: "Shipped",   tracking: "DTDC9988776655" },
  { id: "SB-20250627-011", customer: "Hussain M.", date: "27 Jun 2025", items: 1, total: 849,  status: "Delivered", tracking: "BLUEDART123456" },
  { id: "SB-20250627-010", customer: "Ali S.",     date: "27 Jun 2025", items: 2, total: 549,  status: "Delivered", tracking: "DTDC0011223344" },
  { id: "SB-20250626-009", customer: "Sara B.",    date: "26 Jun 2025", items: 1, total: 399,  status: "Delivered", tracking: "DTDC5566778899" },
];

const statusColor: Record<string, string> = {
  Confirmed: "text-accent-amber bg-accent-amber/10",
  Shipped:   "text-accent-teal bg-accent-teal/10",
  Delivered: "text-success bg-success/10",
  Pending:   "text-muted bg-surface-soft",
};

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Orders</h1>
        <div className="flex gap-2">
          {["All","Pending","Confirmed","Shipped","Delivered"].map((f, i) => (
            <button key={f} className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${i === 0 ? "bg-surface-cream-strong border-hairline text-ink" : "bg-canvas border-hairline text-muted hover:text-ink"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {["Order","Customer","Date","Items","Total","Status","Tracking","Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface-soft transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-ink">{o.id}</td>
                <td className="px-4 py-3 text-body">{o.customer}</td>
                <td className="px-4 py-3 text-xs text-muted">{o.date}</td>
                <td className="px-4 py-3 text-center text-ink">{o.items}</td>
                <td className="px-4 py-3 font-medium text-ink">₹{o.total}</td>
                <td className="px-4 py-3">
                  <select className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${statusColor[o.status] ?? "text-muted"}`} defaultValue={o.status}>
                    {["Pending","Confirmed","Shipped","Delivered"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {o.tracking ? (
                    <span className="font-mono text-xs text-ink">{o.tracking}</span>
                  ) : (
                    <input
                      type="text"
                      placeholder="Add tracking no."
                      className="h-7 px-2 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary w-36"
                    />
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-primary hover:text-primary-active font-medium">Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
