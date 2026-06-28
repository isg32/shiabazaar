import Link from "next/link";
import { ChevronRight, RotateCcw } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

const orders = [
  { id: "SB-20250628-001", date: "28 Jun 2025", status: "Confirmed", total: 1347, items: ["Nahjul Balagha", "Mafatih Al-Jinan x2"] },
  { id: "SB-20250610-088", date: "10 Jun 2025", status: "Delivered", total: 699,  items: ["Nahjul Balagha"], tracking: "DTDC1234567890" },
  { id: "SB-20250520-044", date: "20 May 2025", status: "Delivered", total: 849,  items: ["Ayatul Kursi Night Lamp"], tracking: "BLUEDART987654" },
  { id: "SB-20250412-019", date: "12 Apr 2025", status: "Delivered", total: 399,  items: ["Karbala & Imam Husayn"], tracking: "DTDC0011223344" },
];

const badgeVariantMap: Record<string, "coral" | "amber" | "success" | "neutral"> = {
  Confirmed: "amber",
  Shipped:   "neutral",
  Delivered: "success",
  Pending:   "neutral",
};

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-sm text-ink">My Orders</h1>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-surface-card rounded-xl border border-hairline overflow-hidden">
            {/* Order header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-ink">{order.id}</p>
                <Badge label={order.status} variant={badgeVariantMap[order.status]} />
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>{order.date}</span>
                <span className="font-semibold text-ink">₹{order.total}</span>
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-4">
              <ul className="text-sm text-body space-y-1">
                {order.items.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-soft inline-block" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-hairline bg-canvas">
              {order.tracking ? (
                <p className="text-xs text-muted">
                  Tracking: <span className="font-mono text-ink">{order.tracking}</span>
                </p>
              ) : (
                <p className="text-xs text-muted">Tracking will appear once shipped</p>
              )}
              <div className="flex gap-3">
                {order.status === "Delivered" && (
                  <button className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-error transition-colors">
                    <RotateCcw size={12} /> Request Return
                  </button>
                )}
                <Link
                  href={`/order/${order.id}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-active font-medium"
                >
                  View Details <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
