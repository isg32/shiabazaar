import { db } from "@/lib/db";
import { loadFacts, mainCategory, type Facts, type MainCategory } from "./facts";
import { loadAccounts, type Account, type Kind, getSettings } from "./credit";
import type { DashFilters } from "./filters";

/*
 * Datasets behind the phase-3 analytics pages AND the downloadable report
 * library, so a page and its export always show the same numbers. All money
 * is in paise.
 */

type F = Pick<DashFilters, "channel" | "buyer" | "category">;
const sumBy = <T>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);

/** Per-order goods value (net of bill discount) and gross for orders present in the facts. */
export function orderTotals(facts: Facts) {
  const m = new Map<string, { gross: number; net: number; qty: number }>();
  for (const l of facts.lines) {
    const o = m.get(l.orderId) ?? { gross: 0, net: 0, qty: 0 };
    o.gross += l.gross; o.net += l.net; o.qty += l.qty;
    m.set(l.orderId, o);
  }
  for (const v of m.values()) v.net = Math.round(v.net);
  return m;
}

/* ── Schools & vendors ─────────────────────────────────────────────────── */

export type Segment = "high" | "medium" | "low" | "frequent" | "inactive" | "highcredit" | "nearlimit";
export const SEGMENT_LABEL: Record<Segment, string> = {
  high: "High value", medium: "Medium value", low: "Low value", frequent: "High frequency",
  inactive: "Inactive", highcredit: "High credit", nearlimit: "Near credit limit",
};
export const SEGMENT_HELP: Record<Segment, string> = {
  high: "top 20% of accounts by sales in the period",
  medium: "next 30% by sales",
  low: "remaining accounts with sales",
  frequent: "transaction count in the top quarter (and at least 3)",
  inactive: "no transactions in the period",
  highcredit: "top 20% by current outstanding",
  nearlimit: "near, at or over the credit limit",
};

export type InstitutionRow = {
  account: Account;
  sales: number; transactions: number; avg: number; highest: number; discount: number; returns: number;
  paidInPeriod: number; lastOrder: Date | null;
  segments: Segment[];
};

export async function institutionPerformance(kind: Kind, f: F, from: Date, to: Date): Promise<InstitutionRow[]> {
  const [facts, { accounts }] = await Promise.all([
    loadFacts({ ...f, buyer: kind }, from, to),
    loadAccounts(kind),
  ]);
  const totals = orderTotals(facts);
  const rows: InstitutionRow[] = accounts.map((a) => {
    const orders = [...facts.orders.values()].filter((o) => (kind === "school" ? o.schoolId : o.vendorId) === a.id);
    const ids = new Set(orders.map((o) => o.id));
    const nets = orders.map((o) => totals.get(o.id)?.net ?? 0);
    const gross = sumBy(orders, (o) => totals.get(o.id)?.gross ?? 0);
    const returns = sumBy(facts.returns.filter((r) => ids.has(r.orderId)), (r) => r.amount);
    const settled = sumBy(facts.settlements.filter((s) => s.accountId === a.id), (s) => s.amount);
    const net = sumBy(nets, (n) => n);
    return {
      account: a,
      sales: net - returns,
      transactions: orders.length,
      avg: orders.length ? Math.round(net / orders.length) : 0,
      highest: nets.length ? Math.max(...nets) : 0,
      discount: gross - net,
      returns,
      paidInPeriod: settled + sumBy(orders, (o) => o.amountPaid),
      lastOrder: orders.reduce<Date | null>((m, o) => (!m || o.at > m ? o.at : m), null),
      segments: [],
    };
  });

  // Segmentation (relative to this set of accounts and period)
  const withSales = rows.filter((r) => r.sales > 0).sort((a, b) => b.sales - a.sales);
  withSales.forEach((r, i) => {
    const q = (i + 1) / withSales.length;
    r.segments.push(q <= 0.2 ? "high" : q <= 0.5 ? "medium" : "low");
  });
  const counts = rows.map((r) => r.transactions).filter((n) => n > 0).sort((a, b) => a - b);
  const p75 = counts.length ? counts[Math.floor(counts.length * 0.75)] : Infinity;
  const owed = rows.filter((r) => r.account.balance > 0).sort((a, b) => b.account.balance - a.account.balance);
  const highCredit = new Set(owed.slice(0, Math.max(1, Math.ceil(owed.length * 0.2))).map((r) => r.account.id));
  for (const r of rows) {
    if (r.transactions >= Math.max(3, p75)) r.segments.push("frequent");
    if (r.transactions === 0 && r.account.active) r.segments.push("inactive");
    if (highCredit.has(r.account.id)) r.segments.push("highcredit");
    if (["near", "reached", "exceeded"].includes(r.account.status)) r.segments.push("nearlimit");
  }
  return rows;
}

/* ── Individual customers ──────────────────────────────────────────────── */

export type CustomerSegment = "new" | "active" | "repeat" | "inactive";
export type CustomerRow = {
  key: string; name: string; contact: string; source: "Walk-in" | "Website";
  first: Date; last: Date; purchases: number; total: number; avg: number; daysSince: number;
  periodValue: number; prevValue: number; segments: CustomerSegment[];
};

/** Activity for identifiable individual buyers: walk-in customers (by phone) and website accounts. */
export async function customerActivity(f: F, from: Date, to: Date, prevFrom: Date, now = Date.now()): Promise<{ rows: CustomerRow[]; inactiveDays: number }> {
  const settings = await getSettings();
  const orders = await db.order.findMany({
    where: {
      buyerType: "individual",
      status: { not: "cancelled" },
      OR: [{ channel: "offline" }, { amountPaid: { gt: 0 } }],
      ...(f.channel ? { channel: f.channel } : {}),
      AND: [{ OR: [{ customerId: { not: null } }, { userId: { not: null } }] }],
    },
    select: {
      createdAt: true, subtotal: true, discountAmount: true, channel: true,
      customer: { select: { id: true, name: true, phone: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const m = new Map<string, CustomerRow>();
  for (const o of orders) {
    const key = o.customer ? `c:${o.customer.id}` : `u:${o.user!.id}`;
    const value = o.subtotal - o.discountAmount;
    let r = m.get(key);
    if (!r) {
      r = {
        key,
        name: o.customer ? o.customer.name ?? "(no name)" : o.user!.name ?? o.user!.email,
        contact: o.customer ? o.customer.phone : o.user!.email,
        source: o.customer ? "Walk-in" : "Website",
        first: o.createdAt, last: o.createdAt, purchases: 0, total: 0, avg: 0, daysSince: 0,
        periodValue: 0, prevValue: 0, segments: [],
      };
      m.set(key, r);
    }
    r.purchases += 1; r.total += value;
    if (o.createdAt < r.first) r.first = o.createdAt;
    if (o.createdAt > r.last) r.last = o.createdAt;
    if (o.createdAt >= from && o.createdAt < to) r.periodValue += value;
    if (o.createdAt >= prevFrom && o.createdAt < from) r.prevValue += value;
  }
  const rows = [...m.values()].map((r) => {
    const daysSince = Math.floor((now - r.last.getTime()) / 86_400_000);
    const segments: CustomerSegment[] = [];
    if (r.first >= from && r.first < to) segments.push("new");
    if (daysSince <= settings.inactiveDays) segments.push("active"); else segments.push("inactive");
    if (r.purchases >= 2) segments.push("repeat");
    return { ...r, avg: Math.round(r.total / r.purchases), daysSince, segments };
  });
  return { rows, inactiveDays: settings.inactiveDays };
}

/* ── Staff ─────────────────────────────────────────────────────────────── */

export type StaffRow = {
  key: string; name: string; transactions: number; sales: number; avg: number; discount: number;
  creditGenerated: number; collected: number;
};

/** Desk activity per staff member (who entered it); website orders are grouped as "Website checkout". */
export async function staffPerformance(f: F, from: Date, to: Date): Promise<StaffRow[]> {
  const facts = await loadFacts(f, from, to);
  const totals = orderTotals(facts);
  const settlements = facts.categoryScoped ? [] : await Promise.all([
    db.schoolPayment.findMany({ where: { receivedAt: { gte: from, lt: to } }, select: { amount: true, recordedById: true } }),
    db.vendorPayment.findMany({ where: { receivedAt: { gte: from, lt: to } }, select: { amount: true, recordedById: true } }),
  ]).then(([a, b]) => (f.channel === "online" ? [] : [...(f.buyer !== "vendor" && f.buyer !== "individual" ? a : []), ...(f.buyer !== "school" && f.buyer !== "individual" ? b : [])]));

  const rows = new Map<string, StaffRow>();
  const row = (key: string) => {
    let r = rows.get(key);
    if (!r) { r = { key, name: key, transactions: 0, sales: 0, avg: 0, discount: 0, creditGenerated: 0, collected: 0 }; rows.set(key, r); }
    return r;
  };
  for (const o of facts.orders.values()) {
    const r = row(o.channel === "online" ? "online" : o.recordedById ?? "unknown");
    const t = totals.get(o.id)!;
    r.transactions += 1; r.sales += t.net; r.discount += t.gross - t.net;
    if (o.buyer !== "individual") r.creditGenerated += Math.max(o.total - o.amountPaid, 0);
    if (!facts.categoryScoped) r.collected += o.amountPaid;
  }
  for (const p of settlements) row(p.recordedById ?? "unknown").collected += p.amount;

  const userIds = [...rows.keys()].filter((k) => k !== "online" && k !== "unknown");
  const users = userIds.length ? await db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }) : [];
  for (const r of rows.values()) {
    const u = users.find((x) => x.id === r.key);
    r.name = r.key === "online" ? "Website checkout" : r.key === "unknown" ? "Not recorded" : u?.name || u?.email || "Removed user";
    r.avg = r.transactions ? Math.round(r.sales / r.transactions) : 0;
  }
  return [...rows.values()].sort((a, b) => b.sales - a.sales);
}

/* ── Payment modes ─────────────────────────────────────────────────────── */

export type ModeRow = { method: string; transactions: number; amount: number; atSale: number; settlements: number };

export function paymentModes(facts: Facts): ModeRow[] {
  const m = new Map<string, ModeRow>();
  const row = (method: string) => {
    let r = m.get(method);
    if (!r) { r = { method, transactions: 0, amount: 0, atSale: 0, settlements: 0 }; m.set(method, r); }
    return r;
  };
  for (const p of facts.atSalePayments) { const r = row(p.method); r.transactions += 1; r.amount += p.amount; r.atSale += p.amount; }
  for (const p of facts.settlements) { const r = row(p.method); r.transactions += 1; r.amount += p.amount; r.settlements += p.amount; }
  return [...m.values()].sort((a, b) => b.amount - a.amount);
}

export const modeLabel = (m: string) => (m === "online" ? "Online (Razorpay)" : m === "split" ? "Split" : m.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()));

/* ── Discounts ─────────────────────────────────────────────────────────── */

export type DiscountTx = { orderId: string; at: Date; buyer: string; buyerName: string; gross: number; net: number; discount: number; pct: number };

export async function discountTransactions(facts: Facts): Promise<DiscountTx[]> {
  const totals = orderTotals(facts);
  const ids = [...totals.entries()].filter(([, t]) => t.gross - t.net > 0).map(([id]) => id);
  const names = await buyerNames(ids);
  return ids.map((id) => {
    const t = totals.get(id)!, o = facts.orders.get(id)!;
    return { orderId: id, at: o.at, buyer: o.buyer, buyerName: names.get(id) ?? "—", gross: t.gross, net: t.net, discount: t.gross - t.net, pct: t.gross ? Math.round(((t.gross - t.net) / t.gross) * 1000) / 10 : 0 };
  }).sort((a, b) => b.discount - a.discount);
}

/** Human buyer name per order id (school/vendor/customer/account). */
export async function buyerNames(orderIds: string[]): Promise<Map<string, string>> {
  if (!orderIds.length) return new Map();
  const orders = await db.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true, buyerType: true,
      school: { select: { name: true, code: true } }, vendor: { select: { name: true, code: true } },
      customer: { select: { name: true, phone: true } }, user: { select: { name: true, email: true } },
    },
  });
  return new Map(orders.map((o) => [o.id,
    o.school ? `${o.school.name}${o.school.code ? ` (${o.school.code})` : ""}`
    : o.vendor ? `${o.vendor.name}${o.vendor.code ? ` (${o.vendor.code})` : ""}`
    : o.customer ? (o.customer.name ? `${o.customer.name} · ${o.customer.phone}` : o.customer.phone)
    : o.user ? o.user.name || o.user.email : "Walk-in"]));
}

/** Group discount by buyer (key from buyerNames) for one buyer type. */
export function discountByBuyer(txs: DiscountTx[], buyer: string) {
  const m = new Map<string, { name: string; transactions: number; gross: number; discount: number }>();
  for (const t of txs.filter((x) => x.buyer === buyer)) {
    const r = m.get(t.buyerName) ?? { name: t.buyerName, transactions: 0, gross: 0, discount: 0 };
    r.transactions += 1; r.gross += t.gross; r.discount += t.discount;
    m.set(t.buyerName, r);
  }
  return [...m.values()].sort((a, b) => b.discount - a.discount);
}

export function discountByMain(facts: Facts) {
  const m = new Map<MainCategory, { main: MainCategory; gross: number; net: number }>();
  for (const l of facts.lines) {
    const k = mainCategory(l.type);
    const r = m.get(k) ?? { main: k, gross: 0, net: 0 };
    r.gross += l.gross; r.net += l.net;
    m.set(k, r);
  }
  return [...m.values()].map((r) => ({ ...r, net: Math.round(r.net), discount: r.gross - Math.round(r.net) })).sort((a, b) => b.discount - a.discount);
}

/* ── Returns & cancellations ───────────────────────────────────────────── */

export async function cancellations(f: F, from: Date, to: Date) {
  return db.order.findMany({
    where: {
      status: "cancelled", createdAt: { gte: from, lt: to },
      ...(f.channel ? { channel: f.channel } : {}), ...(f.buyer ? { buyerType: f.buyer } : {}),
    },
    select: { id: true, createdAt: true, channel: true, buyerType: true, subtotal: true, discountAmount: true },
    orderBy: { createdAt: "desc" },
  });
}

export function returnsBy<K extends string>(facts: Facts, key: (r: Facts["returns"][number]) => K) {
  const m = new Map<K, { key: K; qty: number; amount: number; count: number }>();
  for (const r of facts.returns) {
    const k = key(r);
    const x = m.get(k) ?? { key: k, qty: 0, amount: 0, count: 0 };
    x.qty += r.qty; x.amount += r.amount; x.count += 1;
    m.set(k, x);
  }
  return [...m.values()].sort((a, b) => b.amount - a.amount);
}
