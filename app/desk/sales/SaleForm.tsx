"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LineEditor, { type SaleLine } from "./LineEditor";
import PaymentPanel, {
  type BillDiscount,
  type PaymentRow,
  billDiscountRupees,
  effectivePayments,
  newPaymentRow,
  paymentsPayload,
} from "./PaymentPanel";

export type { SaleLine };

const inputCls = "h-9 px-2 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary";

export default function SaleForm({
  mode,
  orderId,
  initialLines = [],
  initialPayments,
  initialDiscount = 0,
  initialCustomerName = "",
  initialCustomerPhone = "",
  initialNote = "",
}: {
  mode: "new" | "edit";
  orderId?: string;
  initialLines?: SaleLine[];
  initialPayments?: PaymentRow[];
  initialDiscount?: number; // rupees
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialNote?: string;
}) {
  const router = useRouter();

  const [lines, setLines] = useState<SaleLine[]>(initialLines);
  const [discount, setDiscount] = useState<BillDiscount>({ kind: "flat", value: initialDiscount ? String(initialDiscount) : "" });
  const [payments, setPayments] = useState<PaymentRow[]>(() =>
    initialPayments?.length ? (initialPayments.length === 1 ? [{ ...initialPayments[0], amount: "" }] : initialPayments) : [newPaymentRow("cash")],
  );
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [knownCustomer, setKnownCustomer] = useState<string | null>(null);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), [lines]);
  const total = subtotal - billDiscountRupees(subtotal, discount);

  async function lookupCustomer() {
    setKnownCustomer(null);
    if (customerPhone.replace(/\D/g, "").length < 6) return;
    const d = await fetch(`/api/desk/customers?phone=${encodeURIComponent(customerPhone)}`).then((r) => r.json()).catch(() => null);
    const c = d?.customer;
    if (!c) return;
    setKnownCustomer(`Returning customer · ${c._count.orders} previous ${c._count.orders === 1 ? "bill" : "bills"}`);
    if (!customerName.trim() && c.name) setCustomerName(c.name);
  }

  async function submit() {
    setError(null);
    if (lines.length === 0) { setError("Add at least one item."); return; }
    setSaving(true);
    const res = await fetch(
      mode === "new" ? "/api/desk/sales" : `/api/desk/sales/${orderId}`,
      {
        method: mode === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            qty: l.qty,
            unitPrice: l.unitPrice,
          })),
          billDiscount: billDiscountRupees(subtotal, discount),
          payments: paymentsPayload(effectivePayments(payments, "full", total)),
          customerName,
          customerPhone,
          note,
        }),
      },
    );
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not save the sale.");
      return;
    }
    router.push("/desk/sales");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <LineEditor lines={lines} onChange={setLines} />

      <PaymentPanel
        mode="full"
        subtotal={subtotal}
        discount={discount}
        onDiscountChange={setDiscount}
        payments={payments}
        onPaymentsChange={setPayments}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Customer phone (optional)</span>
          <input
            value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} onBlur={lookupCustomer}
            className={inputCls}
          />
          {knownCustomer && <span className="text-[11px] text-success" data-testid="known-customer">{knownCustomer}</span>}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Customer name (optional)</span>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs text-on-dark-soft">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
        </label>
      </div>

      {error && <p className="text-sm text-error mb-3">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-white/8 pt-4">
        <button
          onClick={() => router.push("/desk/sales")}
          className="h-9 px-4 text-sm font-medium rounded-md text-on-dark-soft hover:text-on-dark hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit} disabled={saving || lines.length === 0}
          className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "new" ? "Record sale" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
