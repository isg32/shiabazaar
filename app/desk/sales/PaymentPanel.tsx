"use client";

import { Plus, Trash2 } from "lucide-react";

export const PAYMENT_MODES = ["cash", "upi", "card", "bank_transfer", "cheque", "other"];

export type BillDiscount = { kind: "flat" | "pct"; value: string };
export type PaymentRow = { key: string; method: string; amount: string };

let seq = 0;
export const newPaymentRow = (method = "cash", amount = ""): PaymentRow => ({ key: `p${++seq}`, method, amount });

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Bill-level discount in rupees for a subtotal, clamped to [0, subtotal]. */
export function billDiscountRupees(subtotal: number, d: BillDiscount): number {
  const v = Math.max(0, Number(d.value) || 0);
  const r = d.kind === "pct" ? (subtotal * Math.min(v, 100)) / 100 : v;
  return round2(Math.min(r, subtotal));
}

export const paymentsTotal = (rows: PaymentRow[]) => round2(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0));

/** In full-payment mode a single row left blank means "the whole bill". */
export function effectivePayments(rows: PaymentRow[], mode: "full" | "credit", total: number): PaymentRow[] {
  if (mode === "full" && rows.length === 1 && rows[0].amount === "") return [{ ...rows[0], amount: String(total) }];
  return rows;
}

/** Shape the API expects. */
export const paymentsPayload = (rows: PaymentRow[]) =>
  rows.filter((r) => Number(r.amount) > 0).map((r) => ({ method: r.method, amount: Number(r.amount) }));

const inputCls = "h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary";
const rs = (n: number) => `₹${n.toFixed(2)}`;

/**
 * Bill discount + payments taken at the counter.
 * - `mode="full"` (walk-in): payments must add up to the bill.
 * - `mode="credit"` (school/vendor): any amount; the rest goes onto credit and an
 *   overpayment becomes advance credit.
 */
export default function PaymentPanel({
  mode,
  subtotal,
  discount,
  onDiscountChange,
  payments,
  onPaymentsChange,
}: {
  mode: "full" | "credit";
  subtotal: number;
  discount: BillDiscount;
  onDiscountChange: (d: BillDiscount) => void;
  payments: PaymentRow[];
  onPaymentsChange: (rows: PaymentRow[]) => void;
}) {
  const discountR = billDiscountRupees(subtotal, discount);
  const total = round2(subtotal - discountR);
  const paid = paymentsTotal(effectivePayments(payments, mode, total));
  const diff = round2(total - paid);

  const update = (key: string, patch: Partial<PaymentRow>) =>
    onPaymentsChange(payments.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => onPaymentsChange(payments.filter((r) => r.key !== key));
  const add = () => onPaymentsChange([...payments, newPaymentRow("cash", diff > 0 ? String(diff) : "")]);

  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-4 mb-5" data-testid="payment-panel">
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Bill discount</span>
          <div className="flex">
            <input
              type="number" min={0} step="0.01" value={discount.value} aria-label="Bill discount"
              onChange={(e) => onDiscountChange({ ...discount, value: e.target.value })}
              className={`${inputCls} w-28 rounded-r-none`}
            />
            <select
              value={discount.kind} aria-label="Bill discount type"
              onChange={(e) => onDiscountChange({ ...discount, kind: e.target.value as BillDiscount["kind"] })}
              className={`${inputCls} rounded-l-none border-l-0`}
            >
              <option value="flat">₹</option>
              <option value="pct">%</option>
            </select>
          </div>
        </label>
        <div className="ml-auto text-right text-sm">
          <p className="text-on-dark-soft">Subtotal {rs(subtotal)}{discountR > 0 && <> · Discount −{rs(discountR)}</>}</p>
          <p className="text-on-dark">Total <span className="font-semibold text-lg ml-1" data-testid="bill-total">{rs(total)}</span></p>
        </div>
      </div>

      <p className="text-xs text-on-dark-soft mb-2">
        {mode === "full" ? "Payment" : "Paid now (leave empty if fully on credit)"}
      </p>
      <div className="flex flex-col gap-2 mb-3">
        {payments.map((r) => (
          <div key={r.key} className="flex items-center gap-2">
            <select
              value={r.method} aria-label="Payment mode"
              onChange={(e) => update(r.key, { method: e.target.value })}
              className={`${inputCls} capitalize w-40`}
            >
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
            </select>
            <input
              type="number" min={0} step="0.01" value={r.amount} aria-label="Payment amount"
              placeholder={mode === "full" && payments.length === 1 ? `${total.toFixed(2)} (full)` : "Amount ₹"}
              onChange={(e) => update(r.key, { amount: e.target.value })}
              className={`${inputCls} w-32`}
            />
            {(mode === "credit" || payments.length > 1) && (
              <button onClick={() => remove(r.key)} aria-label="Remove payment" className="text-on-dark-soft hover:text-error transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={add}
          className="self-start h-8 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <Plus size={12} /> {payments.length === 0 ? "Add payment" : "Split: add another mode"}
        </button>
      </div>

      <p className="text-sm" data-testid="payment-summary">
        {mode === "full" ? (
          diff === 0 ? <span className="text-success">Paid in full</span>
          : diff > 0 ? <span className="text-error">Remaining {rs(diff)}</span>
          : <span className="text-error">Over by {rs(-diff)}</span>
        ) : diff > 0 ? (
          <span className="text-accent-amber">Credit added {rs(diff)}{paid > 0 && <> · paid {rs(paid)}</>}</span>
        ) : diff < 0 ? (
          <span className="text-success">Advance credit {rs(-diff)} (paid {rs(paid)})</span>
        ) : (
          <span className="text-success">Paid in full</span>
        )}
      </p>
    </div>
  );
}
