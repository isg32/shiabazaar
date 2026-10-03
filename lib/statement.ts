/*
 * School/vendor account statement — pure, so the desk (client) and the BI
 * dashboard (server) render identical ledgers. Positive balance = owed to us,
 * negative = advance credit held for the account.
 */

type Dateish = string | Date;
export type StmtOrder = {
  id: string; status: string; total: number; amountPaid: number; discountAmount: number; createdAt: Dateish;
  creditOverrideById: string | null;
  items: { title: string }[];
  payments: { method: string; amount: number }[];
  returns: { id: string; amount: number; note: string | null; createdAt: Dateish }[];
};
export type StmtPayment = { id: string; amount: number; method: string; reference: string | null; note: string | null; receivedAt: Dateish };

export type StmtRow<O> = {
  key: string; date: Dateish; label: string; detail?: string;
  sale: number; paid: number; creditAdded: number; creditAdjusted: number;
  running: number; muted: boolean;
  order?: O; paymentId?: string;
};

const r0 = (p: number) => `₹${(p / 100).toFixed(0)}`;
const ms = (d: Dateish) => new Date(d).getTime();

/** Chronological statement with opening/closing balance for [fromMs, toMs] (inclusive; ±Infinity = unbounded). */
export function buildStatement<O extends StmtOrder>(
  orders: O[],
  payments: StmtPayment[],
  { noun = "Issued", fromMs = -Infinity, toMs = Infinity }: { noun?: string; fromMs?: number; toMs?: number } = {},
) {
  type Ev = Omit<StmtRow<O>, "running"> & { t: number; effect: number };
  const evs: Ev[] = [];
  for (const o of orders) {
    const cancelled = o.status === "cancelled";
    const first = o.items[0]?.title ?? "—";
    evs.push({
      key: `o-${o.id}`, t: ms(o.createdAt), date: o.createdAt,
      label: `${noun} — ${first}${o.items.length > 1 ? ` +${o.items.length - 1}` : ""}${cancelled ? " (cancelled)" : ""}`,
      detail: [
        o.discountAmount ? `bill discount ${r0(o.discountAmount)}` : "",
        o.payments.length ? `paid ${o.payments.map((p) => `${p.method.replace(/_/g, " ")} ${r0(p.amount)}`).join(" + ")}` : "",
        o.creditOverrideById ? "credit limit overridden by admin" : "",
      ].filter(Boolean).join(" · "),
      sale: o.total, paid: o.amountPaid,
      creditAdded: Math.max(o.total - o.amountPaid, 0),
      creditAdjusted: Math.max(o.amountPaid - o.total, 0),
      effect: cancelled ? 0 : o.total - o.amountPaid,
      muted: cancelled,
      order: o,
    });
    for (const r of o.returns) {
      evs.push({
        key: `r-${r.id}`, t: ms(r.createdAt), date: r.createdAt,
        label: `Return — ${first}${r.note ? ` (${r.note})` : ""}`,
        sale: 0, paid: 0, creditAdded: 0, creditAdjusted: r.amount, effect: -r.amount, muted: false,
      });
    }
  }
  for (const p of payments) {
    evs.push({
      key: `p-${p.id}`, t: ms(p.receivedAt), date: p.receivedAt,
      label: `Payment received${p.reference ? ` (${p.reference})` : ""} · ${p.method.replace(/_/g, " ")}`,
      detail: p.note ?? undefined,
      sale: 0, paid: p.amount, creditAdded: 0, creditAdjusted: p.amount, effect: -p.amount, muted: false,
      paymentId: p.id,
    });
  }
  evs.sort((a, b) => a.t - b.t);

  let running = 0, opening = 0;
  const rows: StmtRow<O>[] = [];
  for (const { t, effect, ...e } of evs) {
    running += effect;
    if (t < fromMs) { opening = running; continue; }
    if (t > toMs) continue;
    rows.push({ ...e, running });
  }
  return { rows, opening, closing: rows.length ? rows[rows.length - 1].running : opening };
}
