import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Buyer, Channel, DashFilters } from "./filters";

/*
 * Line-level sales facts for the BI dashboard. Definitions (shared by every
 * report so the numbers always agree):
 *   gross     = MRP × qty (legacy lines without MRP use the selling price)
 *   net       = goods value actually charged: line price × qty, less the bill
 *               discount allocated pro-rata across lines. Excludes shipping.
 *   discount  = gross − net  (line discounts + allocated bill discount)
 *   returns   = order_return_lines.amount, booked on the return date
 *   collected = money received in the range: at-sale payments + school/vendor
 *               settlements. Order-level, so not attributable to a category.
 *   credit generated = total − amountPaid on school/vendor issues (if > 0)
 * A counted sale is never cancelled, and an online order only once paid.
 */

export type MainCategory = "Books" | "Gifts" | "Other";
export const mainCategory = (type: string): MainCategory => (type === "book" ? "Books" : type === "gift" ? "Gifts" : "Other");

export type SaleLine = {
  orderId: string; at: Date; channel: Channel; buyer: Buyer;
  productId: string; title: string; type: string; sku: string | null;
  qty: number; gross: number; net: number;
};
export type OrderFact = {
  id: string; at: Date; channel: Channel; buyer: Buyer;
  subtotal: number; discount: number; total: number; amountPaid: number;
  schoolId: string | null; vendorId: string | null; customerId: string | null; userId: string | null; recordedById: string | null;
};
export type ReturnLine = { orderId: string; at: Date; channel: Channel; buyer: Buyer; productId: string; title: string; type: string; qty: number; amount: number };
export type Settlement = { at: Date; kind: "school" | "vendor"; accountId: string; amount: number; method: string };

export type Facts = {
  lines: SaleLine[];
  orders: Map<string, OrderFact>;
  returns: ReturnLine[];
  settlements: Settlement[];
  atSalePayments: { orderId: string; method: string; amount: number }[];
  /** True when a category filter is active: order-level money (collections, credit) can't be split by category. */
  categoryScoped: boolean;
};

/** Category ids for `rootId` and all of its descendants. */
export async function categorySubtree(rootId: string): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE t AS (
      SELECT id FROM categories WHERE id = ${rootId}
      UNION ALL SELECT c.id FROM categories c JOIN t ON c."parentId" = t.id
    ) SELECT id FROM t`;
  return rows.map((r) => r.id);
}

const COUNTED = Prisma.sql`o.status <> 'cancelled' AND (o.channel = 'offline' OR o."amountPaid" > 0)`;

function scope(f: Pick<DashFilters, "channel" | "buyer">, catIds: string[] | null) {
  const parts: Prisma.Sql[] = [COUNTED];
  if (f.channel) parts.push(Prisma.sql`o.channel = ${f.channel}::"SalesChannel"`);
  if (f.buyer) parts.push(Prisma.sql`o."buyerType" = ${f.buyer}::"BuyerType"`);
  if (catIds) parts.push(Prisma.sql`EXISTS (SELECT 1 FROM product_categories pc WHERE pc."productId" = i."productId" AND pc."categoryId" IN (${Prisma.join(catIds)}))`);
  return Prisma.join(parts, " AND ");
}

/** Load every fact needed by the sales reports for [from, to) under the dashboard filters. */
export async function loadFacts(f: Pick<DashFilters, "channel" | "buyer" | "category">, from: Date, to: Date): Promise<Facts> {
  const catIds = f.category ? await categorySubtree(f.category) : null;
  const where = scope(f, catIds && catIds.length ? catIds : null);

  type LineRow = {
    orderId: string; at: Date; channel: Channel; buyer: Buyer;
    subtotal: number; discount: number; total: number; amountPaid: number;
    schoolId: string | null; vendorId: string | null; customerId: string | null; userId: string | null; recordedById: string | null;
    productId: string; title: string; type: string; sku: string | null; qty: number; mrp: number; price: number;
  };
  const settlementsWanted = !catIds && f.channel !== "online" && (f.buyer === null || f.buyer === "school" || f.buyer === "vendor");

  const [rows, rets, sch, ven] = await Promise.all([
    db.$queryRaw<LineRow[]>`
      SELECT o.id AS "orderId", o."createdAt" AS at, o.channel::text AS channel, o."buyerType"::text AS buyer,
             o.subtotal, o."discountAmount" AS discount, o.total, o."amountPaid",
             o."schoolId", o."vendorId", o."customerId", o."userId", o."recordedById",
             i."productId", i.title, p.type::text AS type, p.sku, i.qty, coalesce(i.mrp, i.price) AS mrp, i.price
      FROM orders o
      JOIN order_items i ON i."orderId" = o.id
      JOIN products p ON p.id = i."productId"
      WHERE ${where} AND o."createdAt" >= ${from} AND o."createdAt" < ${to}`,
    db.$queryRaw<ReturnLine[]>`
      SELECT o.id AS "orderId", r."createdAt" AS at, o.channel::text AS channel, o."buyerType"::text AS buyer,
             i."productId", i.title, p.type::text AS type, rl.qty, rl.amount
      FROM order_returns r
      JOIN order_return_lines rl ON rl."returnId" = r.id
      JOIN order_items i ON i.id = rl."orderItemId"
      JOIN orders o ON o.id = r."orderId"
      JOIN products p ON p.id = i."productId"
      WHERE ${where} AND r."createdAt" >= ${from} AND r."createdAt" < ${to}`,
    settlementsWanted && f.buyer !== "vendor"
      ? db.schoolPayment.findMany({ where: { receivedAt: { gte: from, lt: to } }, select: { receivedAt: true, schoolId: true, amount: true, method: true } })
      : Promise.resolve([]),
    settlementsWanted && f.buyer !== "school"
      ? db.vendorPayment.findMany({ where: { receivedAt: { gte: from, lt: to } }, select: { receivedAt: true, vendorId: true, amount: true, method: true } })
      : Promise.resolve([]),
  ]);

  const orders = new Map<string, OrderFact>();
  const lines: SaleLine[] = rows.map((r) => {
    if (!orders.has(r.orderId)) {
      orders.set(r.orderId, {
        id: r.orderId, at: r.at, channel: r.channel, buyer: r.buyer,
        subtotal: r.subtotal, discount: r.discount, total: r.total, amountPaid: r.amountPaid,
        schoolId: r.schoolId, vendorId: r.vendorId, customerId: r.customerId, userId: r.userId, recordedById: r.recordedById,
      });
    }
    const lineValue = r.price * r.qty;
    const net = r.subtotal > 0 ? (lineValue * (r.subtotal - r.discount)) / r.subtotal : 0;
    return {
      orderId: r.orderId, at: r.at, channel: r.channel, buyer: r.buyer,
      productId: r.productId, title: r.title, type: r.type, sku: r.sku,
      qty: r.qty, gross: r.mrp * r.qty, net,
    };
  });

  const ids = [...orders.keys()];
  const atSalePayments = ids.length && !catIds
    ? await db.orderPayment.findMany({ where: { orderId: { in: ids } }, select: { orderId: true, method: true, amount: true } })
    : [];

  return {
    lines,
    orders,
    returns: rets,
    settlements: [
      ...sch.map((p) => ({ at: p.receivedAt, kind: "school" as const, accountId: p.schoolId, amount: p.amount, method: p.method })),
      ...ven.map((p) => ({ at: p.receivedAt, kind: "vendor" as const, accountId: p.vendorId, amount: p.amount, method: p.method })),
    ],
    atSalePayments,
    categoryScoped: !!catIds,
  };
}

export type Summary = {
  gross: number; discount: number; netBeforeReturns: number; returns: number; net: number;
  qty: number; transactions: number; avg: number;
  collectedAtSale: number; settlements: number; collected: number; creditGenerated: number;
  categoryScoped: boolean;
};

/** Headline figures for a set of facts (or a subset of them, e.g. one bucket or one segment). */
export function summarize(
  lines: SaleLine[],
  returns: ReturnLine[],
  orders: Map<string, OrderFact>,
  settlements: Settlement[],
  categoryScoped: boolean,
): Summary {
  let gross = 0, netBefore = 0, qty = 0;
  const seen = new Set<string>();
  for (const l of lines) { gross += l.gross; netBefore += l.net; qty += l.qty; seen.add(l.orderId); }
  const ret = returns.reduce((s, r) => s + r.amount, 0);
  let collectedAtSale = 0, credit = 0;
  for (const id of seen) {
    const o = orders.get(id)!;
    collectedAtSale += o.amountPaid;
    if (o.buyer !== "individual") credit += Math.max(o.total - o.amountPaid, 0);
  }
  const settled = settlements.reduce((s, p) => s + p.amount, 0);
  const net = Math.round(netBefore) - ret;
  return {
    gross,
    discount: gross - Math.round(netBefore),
    netBeforeReturns: Math.round(netBefore),
    returns: ret,
    net,
    qty,
    transactions: seen.size,
    avg: seen.size ? Math.round(netBefore / seen.size) : 0,
    collectedAtSale: categoryScoped ? 0 : collectedAtSale,
    settlements: categoryScoped ? 0 : settled,
    collected: categoryScoped ? 0 : collectedAtSale + settled,
    creditGenerated: categoryScoped ? 0 : credit,
    categoryScoped,
  };
}

export const summarizeAll = (f: Facts) => summarize(f.lines, f.returns, f.orders, f.settlements, f.categoryScoped);

/** % change vs a previous value; null when there's no base. */
export function pctChange(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / Math.abs(prev)) * 1000) / 10;
}
