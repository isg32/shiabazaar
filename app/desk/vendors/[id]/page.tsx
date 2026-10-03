"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Plus, X, Ban, Trash2, Pencil, Undo2 } from "lucide-react";
import LineEditor, { type SaleLine } from "../../sales/LineEditor";
import PaymentPanel, { type BillDiscount, type PaymentRow, billDiscountRupees, paymentsPayload } from "../../sales/PaymentPanel";
import ReturnForm, { type ReturnableOrder } from "../../sales/ReturnForm";
import { buildStatement } from "@/lib/statement";

type OrderItem = ReturnableOrder["items"][number] & { mrp: number | null };
type OrderReturn = { id: string; amount: number; note: string | null; createdAt: string };
type Order = {
  id: string; status: string; total: number; amountPaid: number; discountAmount: number; createdAt: string; notes: string | null;
  creditOverrideById: string | null;
  items: OrderItem[]; payments: { method: string; amount: number }[]; returns: OrderReturn[];
};
type Payment = { id: string; amount: number; method: string; reference: string | null; note: string | null; receivedAt: string };
type Vendor = {
  id: string; name: string; code: string | null; contactName: string | null;
  phone: string | null; email: string | null; address: string | null;
  city: string | null; state: string | null; paymentTermsDays: number | null;
  creditLimit: number; balance: number; active: boolean; notes: string | null;
};
type Data = {
  vendor: Vendor; orders: Order[]; payments: Payment[];
  viewer: { isAdmin: boolean }; defaultPaymentTermsDays: number;
};


const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "cheque"];
const rupees = (paise: number) => `₹${(paise / 100).toFixed(0)}`;
const money = (paise: number) => (paise ? rupees(paise) : "");
/** Signed balance: positive = owed to us, negative = advance credit held for them. */
const balanceLabel = (paise: number) => (paise < 0 ? `${rupees(-paise)} adv` : rupees(paise));
const day = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const returnable = (o: Order) => o.items.reduce((s, i) => s + i.qty - i.returnLines.reduce((r, x) => r + x.qty, 0), 0);

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"issue" | "payment" | "details" | null>(null);
  const [returning, setReturning] = useState<Order | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(() => {
    fetch(`/api/desk/vendors/${id}`)
      .then((r) => r.json())
      .then((d) => (d.vendor ? setData(d) : setErr(d.error ?? "Not found.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const statement = useMemo(() => {
    if (!data) return null;
    return buildStatement(data.orders, data.payments, {
      noun: "Goods issued",
      fromMs: from ? new Date(`${from}T00:00:00`).getTime() : -Infinity,
      toMs: to ? new Date(`${to}T23:59:59.999`).getTime() : Infinity,
    });
  }, [data, from, to]);

  async function cancelIssue(orderId: string) {
    if (!confirm("Cancel this issue? Stock goes back and the balance is reduced.")) return;
    const res = await fetch(`/api/desk/sales/${orderId}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? "Failed."); return; }
    load();
  }
  async function deletePayment(paymentId: string) {
    if (!confirm("Delete this payment? The balance will go back up.")) return;
    const res = await fetch(`/api/desk/vendors/${id}/payments/${paymentId}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json().catch(() => ({}))).error ?? "Failed."); return; }
    load();
  }
  async function toggleActive() {
    if (!data) return;
    await fetch(`/api/desk/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !data.vendor.active }),
    });
    load();
  }

  if (err) return <div className="px-8 py-8 text-sm text-error">{err}</div>;
  if (!data || !statement) {
    return <div className="px-8 py-8 flex items-center gap-2 text-on-dark-soft text-sm"><Loader2 size={15} className="animate-spin" /> Loading…</div>;
  }

  const { vendor } = data;
  const limit = vendor.creditLimit;
  const overLimit = limit > 0 && vendor.balance > limit;
  const available = limit > 0 ? limit - vendor.balance : null;
  const utilisation = limit > 0 ? Math.round((Math.max(vendor.balance, 0) / limit) * 100) : null;
  const terms = vendor.paymentTermsDays ?? data.defaultPaymentTermsDays;

  return (
    <div className="px-8 py-8 text-on-dark">
      <Link href="/desk/vendors" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4 transition-colors">
        <ChevronLeft size={13} /> Back to vendors
      </Link>

      {/* Header */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-on-dark">{vendor.name}</h1>
            <p className="text-sm text-on-dark-soft mt-1">
              {[vendor.code, vendor.contactName, vendor.phone, vendor.email].filter(Boolean).join(" · ") || "No contact details"}
            </p>
            {(vendor.address || vendor.city || vendor.state) && (
              <p className="text-xs text-on-dark-soft/70 mt-1">
                {[vendor.address, vendor.city, vendor.state].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="text-xs text-on-dark-soft/70 mt-1">
              Payment terms: {terms} days{vendor.paymentTermsDays == null ? " (default)" : ""}
            </p>
          </div>
          <div className="text-right shrink-0" data-testid="account-summary">
            <p className="text-[11px] uppercase tracking-wide text-on-dark-soft">
              {vendor.balance < 0 ? "Advance credit" : "Outstanding"}
            </p>
            <p className={`text-3xl font-semibold ${vendor.balance > 0 ? (overLimit ? "text-error" : "text-accent-amber") : "text-success"}`}>
              {rupees(Math.abs(vendor.balance))}
            </p>
            <p className="text-xs text-on-dark-soft mt-0.5">
              {limit > 0
                ? `Limit ${rupees(limit)} · ${available! >= 0 ? `${rupees(available!)} available` : `${rupees(-available!)} over`} · ${utilisation}% used`
                : "No credit limit"}
            </p>
            <button onClick={toggleActive} className="text-[11px] text-primary hover:text-primary-active mt-2">
              {vendor.active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => { setReturning(null); setTab(tab === "issue" ? null : "issue"); }}
            className="h-8 px-3 bg-primary/15 text-primary text-xs font-medium rounded-md flex items-center gap-1.5 hover:bg-primary/25 transition-colors"
          >
            {tab === "issue" ? <X size={12} /> : <Plus size={12} />} Record Issue
          </button>
          <button
            onClick={() => { setReturning(null); setTab(tab === "payment" ? null : "payment"); }}
            className="h-8 px-3 bg-success/15 text-success text-xs font-medium rounded-md flex items-center gap-1.5 hover:bg-success/25 transition-colors"
          >
            {tab === "payment" ? <X size={12} /> : <Plus size={12} />} Record Payment
          </button>
          <button
            onClick={() => { setReturning(null); setTab(tab === "details" ? null : "details"); }}
            className="h-8 px-3 bg-white/5 text-on-dark text-xs font-medium rounded-md flex items-center gap-1.5 hover:bg-white/10 transition-colors"
          >
            {tab === "details" ? <X size={12} /> : <Pencil size={12} />} Edit details
          </button>
        </div>

        {tab === "issue" && <IssueForm vendorId={id} onDone={() => { setTab(null); load(); }} />}
        {tab === "payment" && <PaymentForm vendorId={id} onDone={() => { setTab(null); load(); }} />}
        {tab === "details" && <DetailsForm vendor={vendor} onDone={() => { setTab(null); load(); }} />}
        {returning && <ReturnForm order={returning} onClose={() => setReturning(null)} onDone={() => { setReturning(null); load(); }} />}
      </div>

      {/* Statement */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-on-dark mr-auto">Account statement</h2>
          <label className="flex items-center gap-1.5 text-xs text-on-dark-soft">
            From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Statement from"
              className="h-8 px-2 text-xs bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-on-dark-soft">
            To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Statement to"
              className="h-8 px-2 text-xs bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
          </label>
          {(from || to) && (
            <button onClick={() => { setFrom(""); setTo(""); }} className="text-xs text-primary hover:text-primary-active">Clear</button>
          )}
        </div>
        <table className="w-full text-sm" data-testid="statement">
          <thead>
            <tr className="border-b border-white/8">
              {["Date", "Transaction", "Sale", "Payment", "Credit added", "Credit adjusted", "Balance", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/8 bg-white/2">
              <td className="px-4 py-2.5 text-xs text-on-dark-soft">{from ? day(`${from}T00:00:00`) : ""}</td>
              <td className="px-4 py-2.5 text-xs text-on-dark-soft" colSpan={5}>Opening balance</td>
              <td className="px-4 py-2.5 text-xs font-medium text-on-dark" data-testid="opening-balance">{balanceLabel(statement.opening)}</td>
              <td />
            </tr>
            {statement.rows.length === 0 ? (
              <tr><td colSpan={8} className="text-sm text-on-dark-soft text-center py-8">No transactions in this period.</td></tr>
            ) : statement.rows.map((row) => (
              <tr key={row.key} className={`border-b border-white/8 ${row.muted ? "opacity-40" : ""}`}>
                <td className="px-4 py-3 text-xs text-on-dark-soft whitespace-nowrap">{day(row.date)}</td>
                <td className="px-4 py-3 text-xs text-on-dark">
                  {row.label}
                  {row.detail && <span className="block text-[11px] text-on-dark-soft">{row.detail}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-on-dark">{money(row.sale)}</td>
                <td className="px-4 py-3 text-xs text-success">{money(row.paid)}</td>
                <td className="px-4 py-3 text-xs text-error">{money(row.creditAdded)}</td>
                <td className="px-4 py-3 text-xs text-success">{money(row.creditAdjusted)}</td>
                <td className="px-4 py-3 text-xs font-medium text-on-dark whitespace-nowrap">{balanceLabel(row.running)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.order && !row.muted && returnable(row.order) > 0 && (() => {
                      const order = row.order;
                      return (
                        <button onClick={() => { setTab(null); setReturning(order); }}
                          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary-active">
                          <Undo2 size={11} /> Return
                        </button>
                      );
                    })()}
                    {row.order && !row.muted && row.order.returns.length === 0 && (() => {
                      const orderId = row.order.id;
                      return (
                        <button onClick={() => cancelIssue(orderId)} className="flex items-center gap-1 text-[11px] text-error hover:text-error/80">
                          <Ban size={11} /> Cancel
                        </button>
                      );
                    })()}
                    {row.paymentId && (() => {
                      const paymentId = row.paymentId;
                      return (
                        <button onClick={() => deletePayment(paymentId)} className="flex items-center gap-1 text-[11px] text-on-dark-soft hover:text-error">
                          <Trash2 size={11} /> Delete
                        </button>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-white/2">
              <td className="px-4 py-2.5 text-xs text-on-dark-soft">{to ? day(`${to}T00:00:00`) : ""}</td>
              <td className="px-4 py-2.5 text-xs text-on-dark-soft" colSpan={5}>Closing balance</td>
              <td className="px-4 py-2.5 text-xs font-semibold text-on-dark" data-testid="closing-balance">{balanceLabel(statement.closing)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IssueForm({ vendorId, onDone }: { vendorId: string; onDone: () => void }) {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [discount, setDiscount] = useState<BillDiscount>({ kind: "flat", value: "" });
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0), [lines]);

  async function submit(override = false) {
    setError(null);
    if (lines.length === 0) { setError("Add at least one item."); return; }
    setSaving(true);
    const res = await fetch(`/api/desk/vendors/${vendorId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, unitPrice: l.unitPrice })),
        billDiscount: billDiscountRupees(subtotal, discount),
        payments: paymentsPayload(payments),
        note,
        override,
      }),
    });
    setSaving(false);
    if (res.ok) { onDone(); return; }
    const d = await res.json().catch(() => ({}));
    if (d.code === "CREDIT_LIMIT" && d.canOverride && !override) {
      const after = (d.balance + d.credit) / 100;
      if (confirm(`This takes the balance to ₹${after.toFixed(0)}, over the ₹${(d.creditLimit / 100).toFixed(0)} credit limit. Approve as admin?`)) {
        submit(true);
        return;
      }
      setError("Issue not recorded — credit limit would be exceeded.");
      return;
    }
    setError(d.error ?? "Could not record the issue.");
  }

  return (
    <div className="mt-5 pt-5 border-t border-white/8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft mb-3">Record Issue</h3>
      <LineEditor lines={lines} onChange={setLines} />
      <PaymentPanel
        mode="credit"
        subtotal={subtotal}
        discount={discount}
        onDiscountChange={setDiscount}
        payments={payments}
        onPaymentsChange={setPayments}
      />
      <label className="flex flex-col gap-1.5 mb-4 max-w-md">
        <span className="text-xs text-on-dark-soft">Note (optional)</span>
        <input
          value={note} onChange={(e) => setNote(e.target.value)}
          className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary"
        />
      </label>
      {error && <p className="text-sm text-error mb-3" data-testid="issue-error">{error}</p>}
      <button
        onClick={() => submit(false)} disabled={saving || lines.length === 0}
        className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Record issue"}
      </button>
    </div>
  );
}

function PaymentForm({ vendorId, onDone }: { vendorId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!amount || Number(amount) <= 0) { setError("Enter an amount greater than zero."); return; }
    setSaving(true);
    const res = await fetch(`/api/desk/vendors/${vendorId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), method, reference, note, receivedAt }),
    });
    setSaving(false);
    if (res.ok) { onDone(); return; }
    setError((await res.json().catch(() => ({}))).error ?? "Could not record the payment.");
  }

  return (
    <div className="mt-5 pt-5 border-t border-white/8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft mb-3">Record Payment</h3>
      <p className="text-xs text-on-dark-soft mb-3">Paying more than is outstanding is kept as advance credit for future issues.</p>
      <div className="grid sm:grid-cols-3 gap-3 mb-4 max-w-2xl">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Amount (₹)</span>
          <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary capitalize">
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Date received</span>
          <input type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-on-dark-soft">Reference (optional)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs text-on-dark-soft">Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
        </label>
      </div>
      {error && <p className="text-sm text-error mb-3">{error}</p>}
      <button
        onClick={submit} disabled={saving}
        className="h-9 px-5 bg-success text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "Saving…" : "Record payment"}
      </button>
    </div>
  );
}

const DETAIL_FIELDS = [
  ["name", "Name *", "text"],
  ["contactName", "Contact person", "text"],
  ["phone", "Phone", "text"],
  ["email", "Email", "text"],
  ["address", "Address", "text"],
  ["city", "City", "text"],
  ["state", "State", "text"],
  ["creditLimit", "Credit limit (₹, 0 = none)", "number"],
  ["paymentTermsDays", "Payment terms (days, blank = default)", "number"],
  ["notes", "Notes", "text"],
] as const;

function DetailsForm({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => ({
    name: vendor.name,
    contactName: vendor.contactName ?? "",
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    address: vendor.address ?? "",
    city: vendor.city ?? "",
    state: vendor.state ?? "",
    creditLimit: vendor.creditLimit ? String(vendor.creditLimit / 100) : "0",
    paymentTermsDays: vendor.paymentTermsDays != null ? String(vendor.paymentTermsDays) : "",
    notes: vendor.notes ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    const res = await fetch(`/api/desk/vendors/${vendor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { onDone(); return; }
    setError((await res.json().catch(() => ({}))).error ?? "Could not save.");
  }

  return (
    <div className="mt-5 pt-5 border-t border-white/8">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft mb-3">
        Edit details <span className="normal-case tracking-normal font-normal">· code {vendor.code ?? "—"} (fixed)</span>
      </h3>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {DETAIL_FIELDS.map(([field, label, type]) => (
          <label key={field} className="flex flex-col gap-1.5">
            <span className="text-xs text-on-dark-soft">{label}</span>
            <input
              type={type} value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary"
            />
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-error mb-3">{error}</p>}
      <button
        onClick={submit} disabled={saving}
        className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save details"}
      </button>
    </div>
  );
}
