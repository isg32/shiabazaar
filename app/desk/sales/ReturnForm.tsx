"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type ReturnableOrder = {
  id: string;
  createdAt: string;
  total: number;
  discountAmount: number;
  items: { id: string; title: string; qty: number; price: number; returnLines: { qty: number }[] }[];
};

const day = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Pick quantities to return from an offline order. Value mirrors the server: line value scaled by the bill discount. */
export default function ReturnForm({ order, onClose, onDone, credit = true }: { order: ReturnableOrder; onClose: () => void; onDone: () => void; credit?: boolean }) {
  const [qty, setQty] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors the server: line value scaled by the bill discount.
  const scale = order.total + order.discountAmount > 0 ? order.total / (order.total + order.discountAmount) : 1;
  const value = order.items.reduce((s, i) => s + i.price * (Number(qty[i.id]) || 0), 0) * scale;

  async function submit() {
    setError(null);
    const lines = Object.entries(qty).map(([orderItemId, q]) => ({ orderItemId, qty: Number(q) || 0 })).filter((l) => l.qty > 0);
    if (lines.length === 0) { setError("Enter a quantity to return."); return; }
    setSaving(true);
    const res = await fetch(`/api/desk/sales/${order.id}/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, note }),
    });
    setSaving(false);
    if (res.ok) { onDone(); return; }
    setError((await res.json().catch(() => ({}))).error ?? "Could not record the return.");
  }

  return (
    <div className="mt-5 pt-5 border-t border-white/8" data-testid="return-form">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft">
          Return items · {day(order.createdAt)}
        </h3>
        <button onClick={onClose} className="text-on-dark-soft hover:text-on-dark" aria-label="Close return"><X size={14} /></button>
      </div>
      <table className="w-full text-sm mb-4 max-w-2xl">
        <thead>
          <tr className="border-b border-white/8">
            {["Item", "Issued", "Already returned", "Return now"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => {
            const done = i.returnLines.reduce((s, r) => s + r.qty, 0);
            const left = i.qty - done;
            return (
              <tr key={i.id} className="border-b border-white/8">
                <td className="px-3 py-2 text-xs text-on-dark">{i.title}</td>
                <td className="px-3 py-2 text-xs text-on-dark-soft">{i.qty}</td>
                <td className="px-3 py-2 text-xs text-on-dark-soft">{done}</td>
                <td className="px-3 py-2">
                  <input
                    type="number" min={0} max={left} disabled={left === 0} value={qty[i.id] ?? ""} aria-label={`Return qty ${i.title}`}
                    onChange={(e) => setQty((q) => ({ ...q, [i.id]: String(Math.min(left, Math.max(0, Math.trunc(Number(e.target.value) || 0)))) }))}
                    className="w-20 h-8 px-1.5 text-sm bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary disabled:opacity-40"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <label className="flex flex-col gap-1.5 mb-3 max-w-md">
        <span className="text-xs text-on-dark-soft">Reason / note (optional)</span>
        <input value={note} onChange={(e) => setNote(e.target.value)}
          className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary" />
      </label>
      <p className="text-sm text-on-dark-soft mb-3">Return value <span className="text-on-dark font-medium">₹{(value / 100).toFixed(2)}</span> {credit ? "— reduces the outstanding balance." : "— refund this to the customer."}</p>
      {error && <p className="text-sm text-error mb-3">{error}</p>}
      <button
        onClick={submit} disabled={saving}
        className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Record return"}
      </button>
    </div>
  );
}

