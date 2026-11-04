import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Truck, MapPin, ArrowRight, XCircle } from "lucide-react";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order #${id.slice(0, 8).toUpperCase()}` };
}

const STEPS = [
  { label: "Order Placed", icon: CheckCircle },
  { label: "Confirmed",    icon: Package   },
  { label: "Shipped",      icon: Truck     },
  { label: "Delivered",    icon: MapPin    },
] as const;

const STATUS_DONE: Record<string, boolean[]> = {
  pending:    [true, false, false, false],
  processing: [true, true,  false, false],
  shipped:    [true, true,  true,  false],
  delivered:  [true, true,  true,  true ],
  cancelled:  [false, false, false, false],
};

function fmt(v: number) { return `₹${(v / 100).toFixed(0)}`; }

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items:   true,
      address: true,
    },
  });

  if (!order) notFound();

  const done = STATUS_DONE[order.status] ?? [false, false, false, false];
  const isCancelled = order.status === "cancelled";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">

      {/* Header */}
      <div className="text-center mb-12">
        {isCancelled ? (
          <>
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
              <XCircle size={32} className="text-error" />
            </div>
            <h1 className="display-md text-ink mb-2">Order Cancelled</h1>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h1 className="display-md text-ink mb-2">Order Confirmed!</h1>
          </>
        )}
        <p className="text-muted text-sm">
          Order <span className="text-ink font-medium">#{id.slice(0, 8).toUpperCase()}</span>
          {order.createdAt && (
            <> · {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</>
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left: status + items */}
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Status tracker */}
          {!isCancelled && (
            <div className="bg-surface-card rounded-xl p-6">
              <h2 className="text-sm font-medium text-ink mb-6">Order Status</h2>
              <div className="flex items-start">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isLast = i === STEPS.length - 1;
                  const stepDone = done[i];
                  const prevDone = i > 0 && done[i - 1];
                  return (
                    <div key={s.label} className="flex-1 flex flex-col items-center">
                      <div className="relative flex items-center w-full">
                        {i > 0 && <div className={`h-0.5 flex-1 ${prevDone && stepDone ? "bg-success" : "bg-hairline"}`} />}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${stepDone ? "bg-success text-white" : "bg-canvas border-2 border-hairline text-muted"}`}>
                          <Icon size={14} />
                        </div>
                        {!isLast && <div className={`h-0.5 flex-1 ${stepDone ? "bg-success" : "bg-hairline"}`} />}
                      </div>
                      <p className={`text-xs mt-2 text-center ${stepDone ? "text-ink font-medium" : "text-muted"}`}>{s.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-surface-soft rounded-lg border border-hairline">
                {order.trackingNumber ? (
                  <p className="text-xs text-muted">
                    Tracking: <span className="font-mono text-ink">{order.trackingNumber}</span>
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:text-primary-active">Track →</a>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-muted">Tracking number will appear here once your order is shipped.</p>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-surface-card rounded-xl p-6">
            <h2 className="text-sm font-medium text-ink mb-4">Items Ordered</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">Qty: {item.qty} · {fmt(item.price)} each</p>
                  </div>
                  <p className="font-medium text-ink shrink-0">{fmt(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: address + totals */}
        <div className="flex flex-col gap-4">

          {order.address && (
            <div className="bg-surface-card rounded-xl p-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Delivery To</h2>
              <p className="text-sm font-medium text-ink">{order.address.name}</p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {order.address.line1}
                {order.address.line2 && <>, {order.address.line2}</>}<br />
                {order.address.city}, {order.address.state} — {order.address.pincode}
              </p>
              <p className="text-xs text-muted mt-1">{order.address.phone}</p>
            </div>
          )}

          <div className="bg-surface-card rounded-xl p-5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Payment Summary</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success"><span>Discount</span><span>−{fmt(order.discountAmount)}</span></div>
              )}
              <div className="flex justify-between text-body"><span>Shipping</span>
                <span>{order.shippingAmount === 0 ? <span className="text-success">Free</span> : fmt(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-2 mt-2">
                <span>Total</span><span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>

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
