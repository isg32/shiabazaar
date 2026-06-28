import { Search, Filter, ExternalLink, ChevronDown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Orders" };

const orders = [
  { id: "ORD-1041", customer: "Ahmed K.",   email: "ahmed@example.com",  items: 2, total: "₹620",   status: "Delivered",  date: "28 Jun 2025", tracking: "DTDC123456" },
  { id: "ORD-1040", customer: "Fatima R.",  email: "fatima@example.com", items: 1, total: "₹480",   status: "Shipped",    date: "27 Jun 2025", tracking: "BLUDRFT789" },
  { id: "ORD-1039", customer: "Hussain M.", email: "hussain@example.com",items: 3, total: "₹1,200", status: "Processing", date: "27 Jun 2025", tracking: "" },
  { id: "ORD-1038", customer: "Zainab A.",  email: "zainab@example.com", items: 1, total: "₹350",   status: "Delivered",  date: "26 Jun 2025", tracking: "EKART4521" },
  { id: "ORD-1037", customer: "Ali H.",     email: "ali@example.com",    items: 1, total: "₹890",   status: "Cancelled",  date: "25 Jun 2025", tracking: "" },
  { id: "ORD-1036", customer: "Sara B.",    email: "sara@example.com",   items: 4, total: "₹2,100", status: "Delivered",  date: "24 Jun 2025", tracking: "DTDC998877" },
  { id: "ORD-1035", customer: "Raza M.",    email: "raza@example.com",   items: 2, total: "₹760",   status: "Shipped",    date: "23 Jun 2025", tracking: "BLUDRFT456" },
  { id: "ORD-1034", customer: "Noor A.",    email: "noor@example.com",   items: 1, total: "₹540",   status: "Processing", date: "22 Jun 2025", tracking: "" },
  { id: "ORD-1033", customer: "Hassan K.",  email: "hassan@example.com", items: 2, total: "₹1,500", status: "Delivered",  date: "21 Jun 2025", tracking: "EKART1122" },
  { id: "ORD-1032", customer: "Maryam T.",  email: "maryam@example.com", items: 1, total: "₹280",   status: "Cancelled",  date: "20 Jun 2025", tracking: "" },
];

const statusStyles: Record<string, string> = {
  Delivered:  "bg-success/12 text-success",
  Shipped:    "bg-accent-amber/15 text-accent-amber",
  Processing: "bg-white/8 text-on-dark-soft",
  Cancelled:  "bg-error/10 text-error",
};

const tabs = ["All", "Processing", "Shipped", "Delivered", "Cancelled", "Return Requests"];

export default function AdminOrders() {
  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Orders</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">142 total orders</p>
        </div>
        <button className="h-9 px-4 bg-white/8 border border-white/10 text-on-dark text-sm font-medium rounded-md flex items-center gap-2 hover:bg-white/12 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-0 border-b border-white/8 mb-5 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={t} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${i === 0 ? "border-primary text-primary" : "border-transparent text-on-dark-soft hover:text-on-dark"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            placeholder="Search by order ID or customer…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <button className="h-9 px-3 flex items-center gap-1.5 text-sm text-on-dark-soft bg-surface-dark-elevated border border-white/8 rounded-md hover:text-on-dark transition-colors">
          <Filter size={13} /> Date range
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Order ID", "Customer", "Items", "Total", "Status", "Date", "Tracking", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < orders.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">{o.id}</td>
                <td className="px-5 py-3.5">
                  <p className="text-on-dark font-medium">{o.customer}</p>
                  <p className="text-[11px] text-on-dark-soft">{o.email}</p>
                </td>
                <td className="px-5 py-3.5 text-on-dark-soft text-center">{o.items}</td>
                <td className="px-5 py-3.5 text-on-dark font-medium">{o.total}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyles[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">{o.date}</td>
                <td className="px-5 py-3.5">
                  {o.tracking ? (
                    <span className="flex items-center gap-1 text-xs text-accent-amber font-mono">
                      {o.tracking} <ExternalLink size={10} />
                    </span>
                  ) : (
                    <button className="text-xs text-on-dark-soft underline hover:text-on-dark">Add</button>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <button className="flex items-center gap-1 text-xs text-on-dark-soft bg-white/6 hover:bg-white/10 px-2.5 py-1 rounded transition-colors">
                    Status <ChevronDown size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
          <span className="text-xs text-on-dark-soft">Showing 1–{orders.length} of 142</span>
          <div className="flex items-center gap-1">
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Prev</button>
            <button className="h-7 px-3 text-xs text-on-dark bg-white/12 rounded">1</button>
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">2</button>
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
