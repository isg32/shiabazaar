import Link from "next/link";
import { CheckCircle, Package, Truck, MapPin, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Confirmed" };

interface Props { params: Promise<{ id: string }> }

const statusSteps = [
  { label: "Order Placed",  icon: CheckCircle, done: true },
  { label: "Confirmed",     icon: Package,    done: true },
  { label: "Shipped",       icon: Truck,      done: false },
  { label: "Delivered",     icon: MapPin,     done: false },
];

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Confirmation header */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h1 className="display-md text-ink mb-2">Order Confirmed!</h1>
        <p className="text-muted text-sm">
          Thank you for your purchase. Your order <span className="text-ink font-medium">{id}</span> has been placed successfully.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Order status ─────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Status tracker */}
          <div className="bg-surface-card rounded-xl p-6">
            <h2 className="text-sm font-medium text-ink mb-6">Order Status</h2>
            <div className="flex items-start gap-0">
              {statusSteps.map((s, i) => {
                const Icon = s.icon;
                const isLast = i === statusSteps.length - 1;
                return (
                  <div key={s.label} className="flex-1 flex flex-col items-center">
                    <div className="relative flex items-center w-full">
                      {i > 0 && (
                        <div className={`h-0.5 flex-1 ${statusSteps[i-1].done && s.done ? "bg-success" : "bg-hairline"}`} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${s.done ? "bg-success text-white" : "bg-canvas border-2 border-hairline text-muted"}`}>
                        <Icon size={14} />
                      </div>
                      {!isLast && (
                        <div className={`h-0.5 flex-1 ${s.done ? "bg-success" : "bg-hairline"}`} />
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center ${s.done ? "text-ink font-medium" : "text-muted"}`}>{s.label}</p>
                  </div>
                );
              })}
            </div>
            {/* Tracking placeholder */}
            <div className="mt-6 p-4 bg-surface-soft rounded-lg border border-hairline">
              <p className="text-xs text-muted">Tracking number will appear here once your order is shipped.</p>
            </div>
          </div>

          {/* Order items */}
          <div className="bg-surface-card rounded-xl p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {[
                { title: "Nahjul Balagha", author: "Imam Ali (AS)", price: 699, qty: 1 },
                { title: "Mafatih Al-Jinan", author: "Sheikh Abbas Qummi", price: 549, qty: 2 },
              ].map((item) => (
                <div key={item.title} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">{item.author} · Qty: {item.qty}</p>
                  </div>
                  <p className="font-medium text-ink">₹{item.price * item.qty}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ──────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Delivery address */}
          <div className="bg-surface-card rounded-xl p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Delivery To</h2>
            <p className="text-sm font-medium text-ink">Ali Hussain</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              123, Hazrat Abbas Lane<br />
              Mumbai, Maharashtra — 400001
            </p>
          </div>

          {/* Price summary */}
          <div className="bg-surface-card rounded-xl p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Payment Summary</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>₹1,248</span></div>
              <div className="flex justify-between text-body"><span>Shipping</span><span>₹99</span></div>
              <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-2 mt-2">
                <span>Total</span><span>₹1,347</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <Link href="/account/orders" className="w-full inline-flex items-center justify-center gap-2 h-10 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
            View All Orders <ArrowRight size={14} />
          </Link>
          <Link href="/products" className="w-full inline-flex items-center justify-center h-10 border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
