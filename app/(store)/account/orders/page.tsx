"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { Badge } from "@/components/shared/Badge";

type OrderItem = { title: string; qty: number; price: number };
type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  items: OrderItem[];
};

const BADGE_VARIANT: Record<string, "neutral" | "coral" | "amber" | "success" | "error"> = {
  pending:    "neutral",
  processing: "amber",
  shipped:    "neutral",
  delivered:  "success",
  cancelled:  "error",
};

function orderRef(id: string) {
  return `#SB-${id.slice(0, 8).toUpperCase()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-sm text-ink">My Orders</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-sm">No orders yet.</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:text-primary-active font-medium">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-surface-card rounded-xl border border-hairline overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium text-ink">{orderRef(order.id)}</p>
                  <Badge label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} variant={BADGE_VARIANT[order.status]} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span>{fmtDate(order.createdAt)}</span>
                  <span className="font-semibold text-ink">₹{(order.total / 100).toFixed(0)}</span>
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="text-sm text-body space-y-1">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-soft inline-block" />
                      {item.title}{item.qty > 1 ? ` ×${item.qty}` : ""}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-hairline bg-canvas">
                {order.trackingNumber ? (
                  <p className="text-xs text-muted">
                    Tracking: <span className="font-mono text-ink">{order.trackingNumber}</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted">Tracking will appear once shipped</p>
                )}
                <div className="flex gap-3">
                  {order.status === "delivered" && (
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
      )}
    </div>
  );
}
