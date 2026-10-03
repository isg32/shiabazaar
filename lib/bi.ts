import type { BuyerType, Prisma, SalesChannel } from "@prisma/client";
import { db } from "@/lib/db";

/*
 * Shared definitions for the BI dashboard (/dashboard). Unlike the storefront
 * and admin panel, the dashboard deliberately spans BOTH channels — every
 * figure is broken down by `channel` (Website vs Store) and `buyerType`
 * (Individual / School / Vendor) instead of filtering to `online`.
 */

/** A sale that counts: never cancelled; online orders only once paid. */
export const COUNTED_SALE: Prisma.OrderWhereInput = {
  status: { not: "cancelled" },
  OR: [{ channel: "offline" }, { amountPaid: { gt: 0 } }],
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Midnight IST `daysAgo` days back, as a UTC Date. */
export function istDayStart(daysAgo = 0): Date {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS - daysAgo * 86_400_000);
}

/** Start of the current Indian financial year (1 April, IST). */
export function financialYearStart(): Date {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  const year = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return new Date(Date.UTC(year, 3, 1) - IST_OFFSET_MS);
}

export type Range = { from: Date; to?: Date };
const inRange = (r: Range) => ({ gte: r.from, ...(r.to ? { lt: r.to } : {}) });

/** Net sales (bill totals minus returns booked in the range), transaction count and average value. */
export async function salesTotals(r: Range) {
  const [orders, returns] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, _count: true, where: { ...COUNTED_SALE, createdAt: inRange(r) } }),
    db.orderReturn.aggregate({ _sum: { amount: true }, where: { createdAt: inRange(r), order: COUNTED_SALE } }),
  ]);
  const net = (orders._sum.total ?? 0) - (returns._sum.amount ?? 0);
  const count = orders._count;
  return { net, count, avg: count ? Math.round((orders._sum.total ?? 0) / count) : 0 };
}

/** Money actually received in the range: at-sale payments + school/vendor settlements. */
export async function collections(r: Range) {
  const [atSale, school, vendor] = await Promise.all([
    db.orderPayment.aggregate({ _sum: { amount: true }, where: { createdAt: inRange(r), order: COUNTED_SALE } }),
    db.schoolPayment.aggregate({ _sum: { amount: true }, where: { receivedAt: inRange(r) } }),
    db.vendorPayment.aggregate({ _sum: { amount: true }, where: { receivedAt: inRange(r) } }),
  ]);
  return (atSale._sum.amount ?? 0) + (school._sum.amount ?? 0) + (vendor._sum.amount ?? 0);
}

/** Receivables: positive school/vendor balances (advance credit is not a receivable). */
export async function outstanding() {
  const [school, vendor] = await Promise.all([
    db.school.aggregate({ _sum: { balance: true }, _count: true, where: { balance: { gt: 0 } } }),
    db.vendor.aggregate({ _sum: { balance: true }, _count: true, where: { balance: { gt: 0 } } }),
  ]);
  return {
    school: school._sum.balance ?? 0,
    vendor: vendor._sum.balance ?? 0,
    accounts: school._count + vendor._count,
  };
}

export type Segment = { channel: SalesChannel; buyerType: BuyerType; count: number; total: number };

/** Sales split by channel × buyer type for the range (gross of returns). */
export async function salesBySegment(r: Range): Promise<Segment[]> {
  const rows = await db.order.groupBy({
    by: ["channel", "buyerType"],
    _sum: { total: true },
    _count: true,
    where: { ...COUNTED_SALE, createdAt: inRange(r) },
  });
  return rows.map((g) => ({ channel: g.channel, buyerType: g.buyerType, count: g._count, total: g._sum.total ?? 0 }));
}

/** ₹ with Indian lakh/crore compaction. */
export function inr(paise: number): string {
  const r = paise / 100;
  const abs = Math.abs(r);
  if (abs >= 1e7) return `₹${(r / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(r / 1e5).toFixed(2)}L`;
  return `₹${r.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
