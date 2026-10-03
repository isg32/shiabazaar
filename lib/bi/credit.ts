import { db } from "@/lib/db";

/*
 * Credit intelligence for school & vendor accounts.
 *
 * Each non-cancelled issue charges (total − paid at sale − returned value).
 * Payments, plus any negative charge (paid more than the bill), form a credit
 * pool applied FIFO to the oldest open charges. What's left on each charge is
 * the open amount; its age drives the ageing buckets and, against the
 * account's payment terms, the overdue amount. Σ open == max(balance, 0).
 */

export type Kind = "school" | "vendor";
export type CreditStatus = "safe" | "watch" | "near" | "reached" | "exceeded" | "overdue" | "nolimit";

export const STATUS_LABEL: Record<CreditStatus, string> = {
  safe: "Safe", watch: "Watch", near: "Near limit", reached: "Limit reached",
  exceeded: "Limit exceeded", overdue: "Payment overdue", nolimit: "No limit",
};
export const STATUS_TONE: Record<CreditStatus, "good" | "warning" | "serious" | "critical" | "none"> = {
  safe: "good", watch: "warning", near: "serious", reached: "critical", exceeded: "critical", overdue: "critical", nolimit: "none",
};

export const BUCKETS = [
  ["0-7", "0–7 days", 0, 7],
  ["8-30", "8–30 days", 8, 30],
  ["31-60", "31–60 days", 31, 60],
  ["61-90", "61–90 days", 61, 90],
  ["91-180", "91–180 days", 91, 180],
  ["180+", "180+ days", 181, Infinity],
] as const;
export type BucketKey = (typeof BUCKETS)[number][0];

export type OpenInvoice = { orderId: string; at: Date; charge: number; open: number; ageDays: number; overdue: boolean };

export type Account = {
  kind: Kind; id: string; code: string | null; name: string; city: string | null; state: string | null; active: boolean;
  creditLimit: number; balance: number; available: number | null; utilisation: number | null;
  termsDays: number; termsIsDefault: boolean;
  totalSales: number; totalPaid: number; transactions: number;
  lastSale: Date | null; lastPayment: Date | null;
  open: OpenInvoice[]; daysOutstanding: number; overdue: number;
  buckets: Record<BucketKey, number>;
  status: CreditStatus;
  createdAt: Date;
};

export type Settings = { paymentTermsDays: number; creditWatchPct: number; creditNearPct: number; inactiveDays: number; unusualDiscountPct: number };

export async function getSettings(): Promise<Settings> {
  const s = await db.businessSettings.findUnique({ where: { id: 1 } });
  return {
    paymentTermsDays: s?.paymentTermsDays ?? 30,
    creditWatchPct: s?.creditWatchPct ?? 70,
    creditNearPct: s?.creditNearPct ?? 90,
    inactiveDays: s?.inactiveDays ?? 90,
    unusualDiscountPct: s?.unusualDiscountPct ?? 20,
  };
}

const DAY = 86_400_000;
const ageDays = (at: Date, now: number) => Math.max(0, Math.floor((now - at.getTime()) / DAY));

export function statusOf(a: Pick<Account, "creditLimit" | "balance" | "overdue">, s: Settings): CreditStatus {
  if (a.creditLimit > 0 && a.balance > a.creditLimit) return "exceeded";
  if (a.overdue > 0) return "overdue";
  if (a.creditLimit <= 0) return "nolimit";
  const u = (Math.max(a.balance, 0) / a.creditLimit) * 100;
  if (u >= 100) return "reached";
  if (u >= s.creditNearPct) return "near";
  if (u >= s.creditWatchPct) return "watch";
  return "safe";
}

/** Every school/vendor account with ageing, overdue and status. */
export async function loadAccounts(kind?: Kind, now = Date.now()): Promise<{ accounts: Account[]; settings: Settings }> {
  const settings = await getSettings();
  const wantSchool = kind !== "vendor", wantVendor = kind !== "school";
  const orderSelect = {
    id: true, createdAt: true, total: true, amountPaid: true, status: true,
    returns: { select: { amount: true } },
  } as const;
  const [schools, vendors] = await Promise.all([
    wantSchool ? db.school.findMany({ include: { orders: { select: orderSelect }, payments: { select: { amount: true, receivedAt: true } } } }) : [],
    wantVendor ? db.vendor.findMany({ include: { orders: { select: orderSelect }, payments: { select: { amount: true, receivedAt: true } } } }) : [],
  ]);

  const build = (k: Kind, a: (typeof schools)[number] | (typeof vendors)[number]): Account => {
    const live = a.orders.filter((o) => o.status !== "cancelled").sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
    const charges = live.map((o) => ({
      orderId: o.id, at: o.createdAt,
      charge: o.total - o.amountPaid - o.returns.reduce((s, r) => s + r.amount, 0),
    }));
    let pool = a.payments.reduce((s, p) => s + p.amount, 0) + charges.filter((c) => c.charge < 0).reduce((s, c) => s - c.charge, 0);
    const termsDays = a.paymentTermsDays ?? settings.paymentTermsDays;
    const open: OpenInvoice[] = [];
    for (const c of charges) {
      if (c.charge <= 0) continue;
      const applied = Math.min(pool, c.charge);
      pool -= applied;
      const rest = c.charge - applied;
      if (rest > 0) {
        const age = ageDays(c.at, now);
        open.push({ orderId: c.orderId, at: c.at, charge: c.charge, open: rest, ageDays: age, overdue: age > termsDays });
      }
    }
    const buckets = Object.fromEntries(BUCKETS.map(([key]) => [key, 0])) as Record<BucketKey, number>;
    for (const inv of open) {
      const b = BUCKETS.find(([, , lo, hi]) => inv.ageDays >= lo && inv.ageDays <= hi)!;
      buckets[b[0]] += inv.open;
    }
    const overdue = open.filter((i) => i.overdue).reduce((s, i) => s + i.open, 0);
    const lastPayment = a.payments.reduce<Date | null>((m, p) => (!m || p.receivedAt > m ? p.receivedAt : m), null);
    const base = {
      kind: k, id: a.id, code: a.code, name: a.name, city: a.city, state: a.state, active: a.active,
      creditLimit: a.creditLimit, balance: a.balance,
      available: a.creditLimit > 0 ? a.creditLimit - a.balance : null,
      utilisation: a.creditLimit > 0 ? Math.round((Math.max(a.balance, 0) / a.creditLimit) * 100) : null,
      termsDays, termsIsDefault: a.paymentTermsDays == null,
      totalSales: live.reduce((s, o) => s + o.total, 0),
      totalPaid: a.payments.reduce((s, p) => s + p.amount, 0) + live.reduce((s, o) => s + o.amountPaid, 0),
      transactions: live.length,
      lastSale: live.length ? live[live.length - 1].createdAt : null,
      lastPayment,
      open, daysOutstanding: open.length ? open[0].ageDays : 0, overdue, buckets,
      createdAt: a.createdAt,
    };
    return { ...base, status: statusOf(base, settings) };
  };

  return {
    accounts: [...schools.map((s) => build("school", s)), ...vendors.map((v) => build("vendor", v))],
    settings,
  };
}

/** Active accounts with no sale for longer than the inactivity period, longest idle first. */
export function inactiveAccounts(accounts: Account[], inactiveDays: number, now = Date.now()) {
  return accounts
    .filter((a) => a.active)
    .map((a) => ({ a, days: Math.floor((now - (a.lastSale ?? a.createdAt).getTime()) / 86_400_000) }))
    .filter((x) => x.days > inactiveDays)
    .sort((x, y) => y.days - x.days);
}
