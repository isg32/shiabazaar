import { db } from "@/lib/db";
import { loadAccounts } from "./credit";
import { loadFacts, pctChange, summarizeAll } from "./facts";
import { inr } from "./format";
import { istDayStart } from "./core";

export type Severity = "critical" | "serious" | "warning";
export type Alert = { severity: Severity; group: "Credit" | "Sales" | "Operations"; title: string; detail: string; href: string };

const DAY = 86_400_000;
const ref = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

/** Live exception report. Thresholds come from business_settings. */
export async function loadAlerts(now = Date.now()): Promise<Alert[]> {
  const { accounts, settings } = await loadAccounts(undefined, now);
  const out: Alert[] = [];

  // ── Credit ──
  for (const a of accounts.filter((x) => x.active)) {
    const href = `/dashboard/accounts/${a.kind}/${a.id}`;
    const who = `${a.name}${a.code ? ` (${a.code})` : ""}`;
    if (a.status === "exceeded") out.push({ severity: "critical", group: "Credit", title: `Credit limit exceeded — ${who}`, detail: `${inr(a.balance)} outstanding on a ${inr(a.creditLimit)} limit (${a.utilisation}%)`, href });
    if (a.overdue > 0) out.push({ severity: "critical", group: "Credit", title: `Payment overdue — ${who}`, detail: `${inr(a.overdue)} past ${a.termsDays}-day terms · oldest ${a.daysOutstanding} days`, href });
    if (a.status === "near" || a.status === "reached") out.push({ severity: "serious", group: "Credit", title: `Near credit limit — ${who}`, detail: `${a.utilisation}% of ${inr(a.creditLimit)} used`, href });
    const old = a.open.filter((i) => i.ageDays > 90).reduce((s, i) => s + i.open, 0);
    if (old > 0) out.push({ severity: "serious", group: "Credit", title: `Old outstanding — ${who}`, detail: `${inr(old)} unpaid for more than 90 days`, href });
  }

  // ── Sales ──
  for (const a of accounts.filter((x) => x.active)) {
    const since = a.lastSale ?? a.createdAt;
    const idle = Math.floor((now - since.getTime()) / DAY);
    if (idle > settings.inactiveDays) {
      out.push({
        severity: "warning", group: "Sales", href: `/dashboard/accounts/${a.kind}/${a.id}`,
        title: `No sales from ${a.name}${a.code ? ` (${a.code})` : ""}`,
        detail: a.lastSale ? `last sale ${idle} days ago (inactive after ${settings.inactiveDays})` : `no sales since being added ${idle} days ago`,
      });
    }
  }
  const weekStart = istDayStart(6), prevStart = istDayStart(13), tomorrow = new Date(istDayStart(0).getTime() + DAY);
  const [w, pw] = await Promise.all([
    loadFacts({ channel: null, buyer: null, category: null }, weekStart, tomorrow),
    loadFacts({ channel: null, buyer: null, category: null }, prevStart, weekStart),
  ]);
  const W = summarizeAll(w), PW = summarizeAll(pw);
  const salesCh = pctChange(W.net, PW.net);
  if (salesCh != null && salesCh <= -30) {
    out.push({ severity: "serious", group: "Sales", href: "/dashboard/sales?range=7d", title: `Sales down ${-salesCh}% this week`, detail: `${inr(W.net)} in the last 7 days vs ${inr(PW.net)} the 7 days before` });
  }
  const txCh = pctChange(W.transactions, PW.transactions);
  if (txCh != null && Math.abs(txCh) >= 50 && PW.transactions >= 5) {
    out.push({ severity: "warning", group: "Sales", href: "/dashboard/transactions?range=7d", title: `Transaction volume ${txCh > 0 ? "up" : "down"} ${Math.abs(txCh)}%`, detail: `${W.transactions} this week vs ${PW.transactions} the week before` });
  }

  // ── Operations (last 30 days) ──
  const since30 = istDayStart(29);
  const recent = await db.order.findMany({
    where: { createdAt: { gte: since30 } },
    select: {
      id: true, status: true, channel: true, subtotal: true, discountAmount: true, amountPaid: true, creditOverrideById: true,
      items: { select: { title: true, price: true, mrp: true, qty: true } },
      _count: { select: { returns: true } },
    },
  });
  for (const o of recent) {
    const href = `/dashboard/transactions/${o.id}`;
    const counted = o.status !== "cancelled" && (o.channel === "offline" || o.amountPaid > 0);
    if (o.status === "cancelled" && o.channel === "offline") out.push({ severity: "warning", group: "Operations", href, title: `Cancelled transaction ${ref(o.id)}`, detail: `desk entry cancelled (${inr(o.subtotal)})` });
    if (!counted) continue;
    const gross = o.items.reduce((s, i) => s + (i.mrp ?? i.price) * i.qty, 0);
    const net = o.subtotal - o.discountAmount;
    const d = gross ? Math.round(((gross - net) / gross) * 1000) / 10 : 0;
    if (d >= settings.unusualDiscountPct) out.push({ severity: "serious", group: "Operations", href, title: `Unusual discount ${d}% on ${ref(o.id)}`, detail: `${inr(gross - net)} off ${inr(gross)} (threshold ${settings.unusualDiscountPct}%)` });
    const above = o.items.filter((i) => i.mrp != null && i.price > i.mrp);
    if (above.length) out.push({ severity: "warning", group: "Operations", href, title: `Sold above MRP on ${ref(o.id)}`, detail: `${above.map((i) => i.title).slice(0, 2).join(", ")} — check for a data-entry error` });
    if (o.creditOverrideById) out.push({ severity: "warning", group: "Operations", href, title: `Credit limit overridden on ${ref(o.id)}`, detail: "an admin approved an issue past the account's credit limit" });
    if (o._count.returns > 0) out.push({ severity: "warning", group: "Operations", href, title: `Returned transaction ${ref(o.id)}`, detail: "goods returned against this entry" });
  }
  const [noCodeS, noCodeV] = await Promise.all([
    db.school.count({ where: { code: null } }),
    db.vendor.count({ where: { code: null } }),
  ]);
  if (noCodeS + noCodeV > 0) out.push({ severity: "warning", group: "Operations", href: "/dashboard/credit", title: "Missing school/vendor codes", detail: `${noCodeS} schools and ${noCodeV} vendors have no code` });

  const rank = { critical: 0, serious: 1, warning: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

