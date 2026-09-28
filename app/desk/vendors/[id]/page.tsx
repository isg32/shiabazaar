"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2, Plus, X, Ban, Trash2 } from "lucide-react";
import LineEditor, { type SaleLine } from "../../sales/LineEditor";

type OrderItem = { id: string; title: string; qty: number; price: number };
type Order = { id: string; status: string; total: number; createdAt: string; notes: string | null; items: OrderItem[] };
type Payment = { id: string; amount: number; method: string; reference: string | null; note: string | null; receivedAt: string };
type Vendor = {
  id: string; name: string; code: string | null; contactName: string | null;
  phone: string | null; email: string | null; address: string | null;
  creditLimit: number; balance: number; active: boolean; notes: string | null;
};

type LedgerRow =
  | { kind: "issue"; id: string; date: string; label: string; debit: number; credit: 0; cancelled: boolean; running: number }
  | { kind: "payment"; id: string; date: string; label: string; debit: 0; credit: number; cancelled: false; running: number };

const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "cheque"];
const rupees = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ vendor: Vendor; orders: Order[]; payments: Payment[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"issue" | "payment" | null>(null);

  const load = useCallback(() => {
    fetch(`/api/desk/vendors/${id}`)
      .then((r) => r.json())
      .then((d) => (d.vendor ? setData(d) : setErr(d.error ?? "Not found.")));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const ledger = useMemo<LedgerRow[]>(() => {
    if (!data) return [];
    const raw = [
      ...data.orders.map((o) => ({
        kind: "issue" as const, id: o.id, date: o.createdAt, cancelled: o.status === "cancelled",
        label: `Goods issued — ${o.items[0]?.title ?? "—"}${o.items.length > 1 ? ` +${o.items.length - 1}` : ""}`,
        amount: o.total,
      })),
      ...data.payments.map((p) => ({
        kind: "payment" as const, id: p.id, date: p.receivedAt, cancelled: false,
        label: `Payment received${p.reference ? ` (${p.reference})` : ""} · ${p.method.replace(/_/g, " ")}`,
        amount: p.amount,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const rows = raw.map((r) => {
      if (r.kind === "issue") {
        if (!r.cancelled) running += r.amount;
        return { kind: "issue", id: r.id, date: r.date, label: r.label, debit: r.amount, credit: 0, cancelled: r.cancelled, running } as LedgerRow;
      }
      running -= r.amount;
      return { kind: "payment", id: r.id, date: r.date, label: r.label, debit: 0, credit: r.amount, cancelled: false, running } as LedgerRow;
    });
    return rows.reverse();
  }, [data]);

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
  if (!data) {
    return <div className="px-8 py-8 flex items-center gap-2 text-on-dark-soft text-sm"><Loader2 size={15} className="animate-spin" /> Loading…</div>;
  }

  const { vendor } = data;
  const overLimit = vendor.creditLimit > 0 && vendor.balance >= vendor.creditLimit;

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
            {vendor.address && <p className="text-xs text-on-dark-soft/70 mt-1">{vendor.address}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] uppercase tracking-wide text-on-dark-soft">Outstanding</p>
            <p className={`text-3xl font-semibold ${vendor.balance > 0 ? (overLimit ? "text-error" : "text-accent-amber") : "text-success"}`}>
              {rupees(vendor.balance)}
            </p>
            <p className="text-xs text-on-dark-soft mt-0.5">
              {vendor.creditLimit > 0 ? `Limit ${rupees(vendor.creditLimit)}` : "No credit limit"}
            </p>
            <button onClick={toggleActive} className="text-[11px] text-primary hover:text-primary-active mt-2">
              {vendor.active ? "Deactivate" : "Reactivate"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => setTab(tab === "issue" ? null : "issue")}
            className="h-8 px-3 bg-primary/15 text-primary text-xs font-medium rounded-md flex items-center gap-1.5 hover:bg-primary/25 transition-colors"
          >
            {tab === "issue" ? <X size={12} /> : <Plus size={12} />} Record Issue
          </button>
          <button
            onClick={() => setTab(tab === "payment" ? null : "payment")}
            className="h-8 px-3 bg-success/15 text-success text-xs font-medium rounded-md flex items-center gap-1.5 hover:bg-success/25 transition-colors"
          >
            {tab === "payment" ? <X size={12} /> : <Plus size={12} />} Record Payment
          </button>
        </div>

        {tab === "issue" && <IssueForm vendorId={id} onDone={() => { setTab(null); load(); }} />}
        {tab === "payment" && <PaymentForm vendorId={id} onDone={() => { setTab(null); load(); }} />}
      </div>

      {/* Ledger */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h2 className="text-sm font-medium text-on-dark">Ledger</h2>
        </div>
        {ledger.length === 0 ? (
          <p className="text-sm text-on-dark-soft text-center py-8">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Date", "Detail", "Debit", "Credit", "Balance", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, i) => (
                <tr key={`${row.kind}-${row.id}`} className={`${i < ledger.length - 1 ? "border-b border-white/8" : ""} ${row.cancelled ? "opacity-40" : ""}`}>
                  <td className="px-5 py-3 text-xs text-on-dark-soft">
                    {new Date(row.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-xs text-on-dark">
                    {row.label}{row.cancelled ? " (cancelled)" : ""}
                  </td>
                  <td className="px-5 py-3 text-xs text-error">{row.debit ? rupees(row.debit) : ""}</td>
                  <td className="px-5 py-3 text-xs text-success">{row.credit ? rupees(row.credit) : ""}</td>
                  <td className="px-5 py-3 text-xs font-medium text-on-dark">{rupees(row.running)}</td>
                  <td className="px-5 py-3">
                    {row.kind === "issue" && !row.cancelled && (
                      <button onClick={() => cancelIssue(row.id)} className="flex items-center gap-1 text-[11px] text-error hover:text-error/80">
                        <Ban size={11} /> Cancel
                      </button>
                    )}
                    {row.kind === "payment" && (
                      <button onClick={() => deletePayment(row.id)} className="flex items-center gap-1 text-[11px] text-on-dark-soft hover:text-error">
                        <Trash2 size={11} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function IssueForm({ vendorId, onDone }: { vendorId: string; onDone: () => void }) {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(override = false) {
    setError(null);
    if (lines.length === 0) { setError("Add at least one item."); return; }
    setSaving(true);
    const res = await fetch(`/api/desk/vendors/${vendorId}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty, unitPrice: l.unitPrice })),
        note,
        override,
      }),
    });
    setSaving(false);
    if (res.ok) { onDone(); return; }
    const d = await res.json().catch(() => ({}));
    if (d.code === "CREDIT_LIMIT" && !override) {
      if (confirm(`This issue takes the balance to ₹${((d.balance + d.issueTotal) / 100).toFixed(0)}, over the ₹${(d.creditLimit / 100).toFixed(0)} limit. Proceed anyway?`)) {
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
      <label className="flex flex-col gap-1.5 mb-4 max-w-md">
        <span className="text-xs text-on-dark-soft">Note (optional)</span>
        <input
          value={note} onChange={(e) => setNote(e.target.value)}
          className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary"
        />
      </label>
      {error && <p className="text-sm text-error mb-3">{error}</p>}
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
