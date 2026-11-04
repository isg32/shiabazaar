"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, RotateCcw, Loader2, X } from "lucide-react";
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
  const [orders,      setOrders]      = useState<Order[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [returnOrder, setReturnOrder] = useState<string | null>(null);
  const [reason,      setReason]      = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [returnDone,  setReturnDone]  = useState<string[]>([]);
  const [returnErr,   setReturnErr]   = useState("");

  useEffect(() => {
    fetch("/api/account/orders")
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setLoading(false); });
  }, []);

  async function submitReturn(orderId: string) {
    if (!reason.trim()) { setReturnErr("Please describe the reason for your return"); return; }
    setSubmitting(true);
    setReturnErr("");
    const res = await fetch("/api/account/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason }),
    });
    const d = await res.json();
    if (!res.ok) { setReturnErr(d.error ?? "Failed to submit return request"); }
    else { setReturnDone(prev => [...prev, orderId]); setReturnOrder(null); setReason(""); }
    setSubmitting(false);
  }

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
                  {order.status === "delivered" && !returnDone.includes(order.id) && returnOrder !== order.id && (
                    <button
                      onClick={() => { setReturnOrder(order.id); setReason(""); setReturnErr(""); }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-error transition-colors"
                    >
                      <RotateCcw size={12} /> Request Return
                    </button>
                  )}
                  {returnDone.includes(order.id) && (
                    <span className="text-xs text-success">Return requested</span>
                  )}
                  <Link
                    href={`/order/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-active font-medium"
                  >
                    View Details <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Inline return form */}
              {returnOrder === order.id && (
                <div className="px-5 py-4 border-t border-hairline bg-surface-soft">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-ink">Return Request — {orderRef(order.id)}</p>
                    <button onClick={() => setReturnOrder(null)} className="text-muted hover:text-ink">
                      <X size={13} />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Describe why you'd like to return this order…"
                    className="w-full px-3 py-2 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none mb-2"
                  />
                  {returnErr && <p className="text-xs text-error mb-2">{returnErr}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReturn(order.id)}
                      disabled={submitting}
                      className="h-8 px-4 text-xs font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
                    >
                      {submitting ? "Submitting…" : "Submit Request"}
                    </button>
                    <button
                      onClick={() => setReturnOrder(null)}
                      className="h-8 px-4 text-xs font-medium border border-hairline text-muted rounded-md hover:text-ink hover:bg-surface-card transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
