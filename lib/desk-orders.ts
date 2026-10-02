import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { applyStockMovements, movementsFromLines } from "@/lib/inventory";
import type { BuyerType, Prisma } from "@prisma/client";
import { upsertCustomer } from "@/lib/customers";

/** User-facing validation failure — routes turn this into a 400. */
export class DeskOrderError extends Error {}

/** The entry would take a school/vendor past its credit limit and no admin override was given. */
export class CreditLimitError extends DeskOrderError {
  constructor(
    public readonly details: { balance: number; creditLimit: number; credit: number; canOverride: boolean },
  ) {
    super(
      details.canOverride
        ? "This takes the account over its credit limit. Confirm to override."
        : "This takes the account over its credit limit. An admin must approve it.",
    );
  }
}

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "cheque", "other"] as const;

export type SaleLineInput = {
  productId: string;
  variantId?: string | null;
  qty: number | string;
  /** rupees; when omitted the product/variant catalogue price is used */
  unitPrice?: number | string | null;
};

export type ResolvedLine = {
  productId: string;
  variantId: string | null;
  qty: number;
  title: string;
  mrp: number; // paise, catalogue price snapshot
  price: number; // paise, selling price snapshot (≤ mrp when discounted)
};

export type ResolvedPayment = { method: string; amount: number }; // paise

type Customer = { name: string | null; phone: string | null };
type Override = { requested: boolean; allowed: boolean; staffId: string | null };

// A desk write is ~20 sequential queries (stock moves, balances, payments); the
// 5s Prisma default is too tight on a cold or distant connection.
const TX_OPTS = { maxWait: 10_000, timeout: 20_000 };

const REASON_FOR_BUYER_TYPE = {
  individual: "offline_sale",
  school: "school_issue",
  vendor: "vendor_issue",
} as const;

/** Validate raw line input against the catalogue and snapshot title + MRP + price. */
export async function resolveLines(lines: SaleLineInput[]): Promise<ResolvedLine[]> {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new DeskOrderError("Add at least one item.");
  }
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, price: true, variants: { select: { id: true, price: true } } },
  });
  const map = new Map(products.map((p) => [p.id, p]));

  return lines.map((l, idx) => {
    const p = map.get(l.productId);
    if (!p) throw new DeskOrderError(`Line ${idx + 1}: product not found.`);

    const qty = Math.trunc(Number(l.qty));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new DeskOrderError(`Line ${idx + 1}: quantity must be a positive whole number.`);
    }

    let variantId: string | null = null;
    let variantPrice: number | null = null;
    if (l.variantId) {
      const v = p.variants.find((v) => v.id === l.variantId);
      if (!v) throw new DeskOrderError(`Line ${idx + 1}: variant not found.`);
      variantId = v.id;
      variantPrice = v.price;
    }

    const mrp = variantPrice ?? p.price;
    let paise = mrp;
    if (l.unitPrice !== undefined && l.unitPrice !== null && l.unitPrice !== "") {
      const rupees = Number(l.unitPrice);
      if (!Number.isFinite(rupees) || rupees < 0) {
        throw new DeskOrderError(`Line ${idx + 1}: price must be a non-negative number.`);
      }
      paise = Math.round(rupees * 100);
    }

    return { productId: p.id, variantId, qty, title: p.title, mrp, price: paise };
  });
}

/** Payment rows from the form (rupees) → paise. Zero/blank rows are dropped. */
export function resolvePayments(raw: unknown): ResolvedPayment[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) throw new DeskOrderError("Invalid payments.");
  const out: ResolvedPayment[] = [];
  for (const [i, p] of raw.entries()) {
    const rupees = Number(p?.amount);
    if (p?.amount === "" || p?.amount === undefined || rupees === 0) continue;
    if (!Number.isFinite(rupees) || rupees < 0) throw new DeskOrderError(`Payment ${i + 1}: enter a valid amount.`);
    const method = typeof p?.method === "string" ? p.method : "";
    if (!(PAYMENT_METHODS as readonly string[]).includes(method)) {
      throw new DeskOrderError(`Payment ${i + 1}: choose a payment mode.`);
    }
    out.push({ method, amount: Math.round(rupees * 100) });
  }
  return out;
}

/** Bill-level discount in rupees from the form → paise. */
export function resolveBillDiscount(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") return 0;
  const rupees = Number(raw);
  if (!Number.isFinite(rupees) || rupees < 0) throw new DeskOrderError("Bill discount must be a non-negative amount.");
  return Math.round(rupees * 100);
}

export function linesTotal(lines: ResolvedLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}

function totals(lines: ResolvedLine[], billDiscount: number) {
  const subtotal = linesTotal(lines);
  if (billDiscount > subtotal) throw new DeskOrderError("Bill discount can't be more than the subtotal.");
  return { subtotal, discount: billDiscount, total: subtotal - billDiscount };
}

function itemRows(lines: ResolvedLine[]) {
  return lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    title: l.title,
    mrp: l.mrp,
    price: l.price,
    qty: l.qty,
  }));
}

/**
 * Settle what was paid at the counter. Walk-in sales must be paid in full (no
 * payments given = full amount in `fallbackMethod`). School/vendor issues may
 * pay any amount: the rest goes onto credit, an overpayment becomes advance credit.
 */
function settle(buyerType: BuyerType, total: number, payments: ResolvedPayment[] | undefined, fallbackMethod: string | null) {
  let rows = payments ?? [];
  if (buyerType === "individual") {
    if (rows.length === 0) rows = total > 0 ? [{ method: fallbackMethod || "cash", amount: total }] : [];
    const paid = rows.reduce((s, p) => s + p.amount, 0);
    if (paid !== total) {
      throw new DeskOrderError(`Payments add up to ₹${(paid / 100).toFixed(2)} but the bill is ₹${(total / 100).toFixed(2)}.`);
    }
  }
  const amountPaid = rows.reduce((s, p) => s + p.amount, 0);
  const paymentMethod = rows.length === 0 ? null : rows.length === 1 ? rows[0].method : "split";
  return { rows, amountPaid, paymentMethod };
}

/**
 * Lock the school/vendor row and apply a credit change, enforcing the credit
 * limit when the change adds credit. Returns the admin id to stamp as the
 * override approver, or null when no override was needed.
 */
async function applyCredit(
  tx: Prisma.TransactionClient,
  buyerType: BuyerType,
  accountId: string | null,
  creditDelta: number,
  override: Override | undefined,
): Promise<string | null> {
  if (buyerType === "individual" || !accountId || creditDelta === 0) return null;
  const table = buyerType === "school" ? "schools" : "vendors";
  const rows = await tx.$queryRawUnsafe<{ balance: number; creditLimit: number; active: boolean }[]>(
    `SELECT balance, "creditLimit", active FROM "${table}" WHERE id = $1 FOR UPDATE`,
    accountId,
  );
  const acct = rows[0];
  if (!acct) throw new DeskOrderError(`${buyerType === "school" ? "School" : "Vendor"} not found.`);

  let approvedBy: string | null = null;
  if (creditDelta > 0 && acct.creditLimit > 0 && acct.balance + creditDelta > acct.creditLimit) {
    if (!override?.requested || !override.allowed) {
      throw new CreditLimitError({
        balance: acct.balance, creditLimit: acct.creditLimit, credit: creditDelta, canOverride: !!override?.allowed,
      });
    }
    approvedBy = override.staffId;
  }

  if (buyerType === "school") {
    await tx.school.update({ where: { id: accountId }, data: { balance: { increment: creditDelta } } });
  } else {
    await tx.vendor.update({ where: { id: accountId }, data: { balance: { increment: creditDelta } } });
  }
  return approvedBy;
}

type CreateInput = {
  buyerType: BuyerType;
  lines: ResolvedLine[];
  billDiscount?: number;
  payments?: ResolvedPayment[];
  paymentMethod?: string | null; // used only when `payments` is absent
  schoolId?: string | null;
  vendorId?: string | null;
  notes?: string | null;
  staffId?: string | null;
  customer?: Customer | null;
  override?: Override;
};

/** Create an offline sale / school issue / vendor issue: order + items + payments + stock draw-down + credit. */
export async function createDeskOrder(input: CreateInput): Promise<{ id: string }> {
  const { subtotal, discount, total } = totals(input.lines, input.billDiscount ?? 0);
  const { rows, amountPaid, paymentMethod } = settle(input.buyerType, total, input.payments, input.paymentMethod ?? null);
  const accountId = input.buyerType === "school" ? input.schoolId ?? null : input.buyerType === "vendor" ? input.vendorId ?? null : null;

  const order = await db.$transaction(async (tx) => {
    const approvedBy = await applyCredit(tx, input.buyerType, accountId, total - amountPaid, input.override);
    const customerId = input.buyerType === "individual" && input.customer
      ? await upsertCustomer(tx, input.customer.phone, input.customer.name)
      : null;
    const created = await tx.order.create({
      data: {
        channel: "offline",
        buyerType: input.buyerType,
        status: "delivered",
        userId: null,
        schoolId: input.buyerType === "school" ? accountId : null,
        vendorId: input.buyerType === "vendor" ? accountId : null,
        customerId,
        paymentMethod,
        amountPaid,
        creditOverrideById: approvedBy,
        recordedById: input.staffId ?? null,
        notes: input.notes ?? null,
        subtotal,
        discountAmount: discount,
        shippingAmount: 0,
        total,
        items: { create: itemRows(input.lines) },
        payments: { create: rows },
      },
      select: { id: true },
    });

    await applyStockMovements(
      tx,
      movementsFromLines(input.lines, {
        direction: -1,
        reason: REASON_FOR_BUYER_TYPE[input.buyerType],
        refId: created.id,
        userId: input.staffId ?? null,
      }),
    );
    return created;
  }, TX_OPTS);

  revalidateTag("products", "max");
  return order;
}

type UpdateInput = {
  id: string;
  lines: ResolvedLine[];
  billDiscount?: number;
  payments?: ResolvedPayment[]; // absent = keep what was paid at sale (walk-ins: re-settle in full)
  paymentMethod?: string | null;
  notes?: string | null;
  staffId?: string | null;
  customer?: Customer | null;
  override?: Override;
};

/** Replace the lines/payments of an offline order and reconcile stock + credit. */
export async function updateDeskOrder(input: UpdateInput): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: input.id },
      select: {
        channel: true, buyerType: true, status: true, total: true, schoolId: true, vendorId: true,
        amountPaid: true, paymentMethod: true, discountAmount: true,
        items: { select: { productId: true, variantId: true, qty: true } },
        payments: { select: { method: true, amount: true } },
        _count: { select: { returns: true } },
      },
    });
    if (!existing) throw new DeskOrderError("Order not found.");
    if (existing.channel === "online") throw new DeskOrderError("Online orders cannot be edited here.");
    if (existing.status === "cancelled") throw new DeskOrderError("This entry is cancelled.");
    // Line items are replaced wholesale on edit, which would orphan return records.
    if (existing._count.returns > 0) throw new DeskOrderError("This entry has returns recorded and can no longer be edited.");

    const { subtotal, discount, total } = totals(input.lines, input.billDiscount ?? existing.discountAmount);
    const keepPayments = input.payments === undefined && existing.buyerType !== "individual";
    const settled = keepPayments
      ? { rows: existing.payments, amountPaid: existing.amountPaid, paymentMethod: existing.paymentMethod }
      : settle(existing.buyerType, total, input.payments, input.paymentMethod ?? existing.paymentMethod);

    const accountId = existing.buyerType === "school" ? existing.schoolId : existing.buyerType === "vendor" ? existing.vendorId : null;
    const creditDelta = (total - settled.amountPaid) - (existing.total - existing.amountPaid);
    const approvedBy = await applyCredit(tx, existing.buyerType, accountId, creditDelta, input.override);

    const customerId = existing.buyerType === "individual" && input.customer
      ? await upsertCustomer(tx, input.customer.phone, input.customer.name)
      : undefined;

    // Put the old quantities back, then take the new ones out. Compensating moves
    // use refType:null so repeated edits to the same order don't collide.
    await applyStockMovements(
      tx,
      movementsFromLines(existing.items, {
        direction: 1, reason: "adjustment", refType: null, refId: input.id,
        userId: input.staffId ?? null, note: "edit: reverse previous lines",
      }),
    );
    await applyStockMovements(
      tx,
      movementsFromLines(input.lines, {
        direction: -1, reason: "adjustment", refType: null, refId: input.id,
        userId: input.staffId ?? null, note: "edit: apply new lines",
      }),
    );

    await tx.orderItem.deleteMany({ where: { orderId: input.id } });
    if (!keepPayments) await tx.orderPayment.deleteMany({ where: { orderId: input.id } });
    await tx.order.update({
      where: { id: input.id },
      data: {
        subtotal,
        discountAmount: discount,
        total,
        amountPaid: settled.amountPaid,
        paymentMethod: settled.paymentMethod,
        notes: input.notes ?? undefined,
        ...(approvedBy ? { creditOverrideById: approvedBy } : {}),
        ...(customerId !== undefined ? { customerId } : {}),
        items: { create: itemRows(input.lines) },
        ...(keepPayments ? {} : { payments: { create: settled.rows } }),
      },
    });
  }, TX_OPTS);

  revalidateTag("products", "max");
}

/** Soft-cancel an offline order: reverse stock + the credit it added, keep the row. */
export async function cancelDeskOrder(id: string, staffId?: string | null): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      select: {
        channel: true, buyerType: true, status: true, total: true, amountPaid: true, schoolId: true, vendorId: true,
        items: { select: { productId: true, variantId: true, qty: true } },
        _count: { select: { returns: true } },
      },
    });
    if (!existing) throw new DeskOrderError("Order not found.");
    if (existing.channel === "online") throw new DeskOrderError("Online orders cannot be cancelled here.");
    if (existing.status === "cancelled") return;
    if (existing._count.returns > 0) throw new DeskOrderError("This entry has returns recorded and can no longer be cancelled.");

    await applyStockMovements(
      tx,
      movementsFromLines(existing.items, {
        direction: 1, reason: "cancellation", refType: null, refId: id,
        userId: staffId ?? null, note: "sale cancelled",
      }),
    );

    await tx.order.update({ where: { id }, data: { status: "cancelled" } });

    const accountId = existing.buyerType === "school" ? existing.schoolId : existing.buyerType === "vendor" ? existing.vendorId : null;
    await applyCredit(tx, existing.buyerType, accountId, -(existing.total - existing.amountPaid), undefined);
  }, TX_OPTS);

  revalidateTag("products", "max");
}

/**
 * Record a (partial) return against an offline order: stock goes back, and for
 * school/vendor accounts the outstanding drops by the returned value. Value is
 * the line's selling price × qty, scaled by the bill discount.
 */
export async function createDeskReturn(input: {
  orderId: string;
  lines: { orderItemId: string; qty: number | string }[];
  note?: string | null;
  staffId?: string | null;
}): Promise<{ id: string; amount: number }> {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        channel: true, buyerType: true, status: true, subtotal: true, total: true, schoolId: true, vendorId: true,
        items: {
          select: {
            id: true, productId: true, variantId: true, qty: true, price: true,
            returnLines: { select: { qty: true } },
          },
        },
      },
    });
    if (!order) throw new DeskOrderError("Order not found.");
    if (order.channel !== "offline") throw new DeskOrderError("Online returns go through the return-request flow.");
    if (order.status === "cancelled") throw new DeskOrderError("This entry is cancelled.");

    const items = new Map(order.items.map((i) => [i.id, i]));
    const lines: { orderItemId: string; qty: number; amount: number; productId: string; variantId: string | null }[] = [];
    for (const l of input.lines ?? []) {
      const qty = Math.trunc(Number(l.qty));
      if (!qty) continue;
      const item = items.get(l.orderItemId);
      if (!item) throw new DeskOrderError("Return line doesn't belong to this order.");
      const already = item.returnLines.reduce((s, r) => s + r.qty, 0);
      if (qty < 0 || qty > item.qty - already) {
        throw new DeskOrderError(`You can return at most ${item.qty - already} of one of these items.`);
      }
      const gross = item.price * qty;
      const amount = order.subtotal > 0 ? Math.round((gross * order.total) / order.subtotal) : 0;
      lines.push({ orderItemId: item.id, qty, amount, productId: item.productId, variantId: item.variantId });
    }
    if (lines.length === 0) throw new DeskOrderError("Choose at least one item to return.");
    const amount = lines.reduce((s, l) => s + l.amount, 0);

    const ret = await tx.orderReturn.create({
      data: {
        orderId: input.orderId,
        amount,
        note: input.note ?? null,
        recordedById: input.staffId ?? null,
        lines: { create: lines.map(({ orderItemId, qty, amount }) => ({ orderItemId, qty, amount })) },
      },
      select: { id: true },
    });

    await applyStockMovements(
      tx,
      movementsFromLines(lines, {
        direction: 1, reason: "return_restock", refType: "return", refId: ret.id,
        userId: input.staffId ?? null, note: "desk return",
      }),
    );

    const accountId = order.buyerType === "school" ? order.schoolId : order.buyerType === "vendor" ? order.vendorId : null;
    await applyCredit(tx, order.buyerType, accountId, -amount, undefined);
    return { id: ret.id, amount };
  }, TX_OPTS);

  revalidateTag("products", "max");
  return result;
}

/** Narrow a JSON body's optional string field. */
export function optionalString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

/** Payment terms in days from a form field; blank/invalid → null (use the global default). */
export function paymentTerms(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= 3650 ? n : null;
}
