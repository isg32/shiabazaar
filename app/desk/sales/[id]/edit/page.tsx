"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import SaleForm, { type SaleLine } from "../../SaleForm";
import { newPaymentRow } from "../../PaymentPanel";

type ApiItem = {
  id: string; title: string; qty: number; price: number; mrp: number | null;
  productId: string; variantId: string | null;
  product: {
    title: string; slug: string; price: number;
    variants: { id: string; label: string; stock: number; price: number | null }[];
  } | null;
};
type ApiOrder = {
  id: string; channel: string; status: string; paymentMethod: string | null; notes: string | null;
  customer: { name: string | null; phone: string } | null;
  discountAmount: number;
  payments: { method: string; amount: number }[];
  returns: { id: string }[];
  items: ApiItem[];
};

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/desk/sales/${id}`)
      .then((r) => r.json())
      .then((d) => (d.order ? setOrder(d.order) : setError(d.error ?? "Not found.")));
  }, [id]);

  if (error) {
    return <div className="px-8 py-8 text-sm text-error">{error}</div>;
  }
  if (!order) {
    return (
      <div className="px-8 py-8 flex items-center gap-2 text-on-dark-soft text-sm">
        <Loader2 size={15} className="animate-spin" /> Loading…
      </div>
    );
  }
  if (order.status === "cancelled" || order.returns.length > 0) {
    return (
      <div className="px-8 py-8 text-on-dark">
        <Link href="/desk/sales" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4">
          <ChevronLeft size={13} /> Back to sales
        </Link>
        <p className="text-sm text-on-dark-soft">
          {order.status === "cancelled"
            ? "This sale has been cancelled and can no longer be edited."
            : "This sale has returns recorded and can no longer be edited."}
        </p>
      </div>
    );
  }

  const initialLines: SaleLine[] = order.items.map((it, i) => ({
    key: `e${i}`,
    productId: it.productId,
    productTitle: it.product?.title ?? it.title,
    variantId: it.variantId,
    variants: (it.product?.variants ?? []).map((v) => ({
      id: v.id, label: v.label, stock: v.stock,
      price: v.price != null ? v.price / 100 : undefined,
    })),
    qty: it.qty,
    mrp: (it.mrp ?? it.price) / 100,
    unitPrice: it.price / 100,
  }));
  const initialPayments = order.payments.map((p) => newPaymentRow(p.method, String(p.amount / 100)));

  const customerMatch = order.notes?.match(/^Customer:\s*(.+?)(?:\s*·\s*(.+?))?$/m);
  const freeNote = (order.notes ?? "").split("\n").filter((l) => !l.startsWith("Customer:")).join("\n");

  return (
    <div className="px-8 py-8 text-on-dark">
      <Link href="/desk/sales" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4 transition-colors">
        <ChevronLeft size={13} /> Back to sales
      </Link>
      <h1 className="text-2xl font-semibold text-on-dark mb-6">
        Edit Sale <span className="font-mono text-base text-on-dark-soft">#{order.id.slice(0, 8).toUpperCase()}</span>
      </h1>
      <SaleForm
        mode="edit"
        orderId={order.id}
        initialLines={initialLines}
        initialPayments={initialPayments}
        initialDiscount={order.discountAmount / 100}
        initialCustomerName={order.customer ? order.customer.name ?? "" : customerMatch?.[1] ?? ""}
        initialCustomerPhone={order.customer ? order.customer.phone : customerMatch?.[2] ?? ""}
        initialNote={freeNote}
      />
    </div>
  );
}
