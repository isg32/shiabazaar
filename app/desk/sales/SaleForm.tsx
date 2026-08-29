"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LineEditor, { type SaleLine } from "./LineEditor";

export type { SaleLine };

const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "cheque"];

export default function SaleForm({
  mode,
  orderId,
  initialLines = [],
  initialPaymentMethod = "cash",
  initialCustomerName = "",
  initialCustomerPhone = "",
  initialNote = "",
}: {
  mode: "new" | "edit";
  orderId?: string;
  initialLines?: SaleLine[];
  initialPaymentMethod?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialNote?: string;
}) {
  const router = useRouter();

  const [lines, setLines] = useState<SaleLine[]>(initialLines);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          paymentMethod,
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

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Payment method</span>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary capitalize"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Customer name (optional)</span>
          <input
            value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Customer phone (optional)</span>
          <input
            value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Note (optional)</span>
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
          />
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
