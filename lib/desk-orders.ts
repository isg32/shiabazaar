import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { applyStockMovements, movementsFromLines } from "@/lib/inventory";
import type { BuyerType, Prisma } from "@prisma/client";
import { upsertCustomer } from "@/lib/customers";

/** User-facing validation failure — routes turn this into a 400. */
export class DeskOrderError extends Error {}

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

// A desk write is ~20 sequential queries (stock moves, balances, payments); the
// 5s Prisma default is too tight on a cold or distant connection.
const TX_OPTS = { maxWait: 10_000, timeout: 20_000 };

const REASON_FOR_BUYER_TYPE = {
  individual: "offline_sale",
  school: "school_issue",
  vendor: "vendor_issue",
} as const;

/** Validate raw line input against the catalogue and snapshot title + price. */
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

export function linesTotal(lines: ResolvedLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
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

/** Walk-in sales are paid in full at the counter; school/vendor issues go wholly onto credit. */
function paidAtSale(buyerType: BuyerType, total: number): number {
  return buyerType === "individual" ? total : 0;
}

function paymentRows(amountPaid: number, method: string | null | undefined): Prisma.OrderPaymentCreateWithoutOrderInput[] {
  return amountPaid > 0 ? [{ method: method || "other", amount: amountPaid }] : [];
}

type CreateInput = {
  buyerType: BuyerType;
  lines: ResolvedLine[];
  paymentMethod?: string | null;
  schoolId?: string | null;
  vendorId?: string | null;
  notes?: string | null;
  staffId?: string | null;
  customer?: { name: string | null; phone: string | null } | null;
  creditOverrideById?: string | null;
};

/** Create an offline sale / school issue / vendor issue: order + items + stock draw-down (+ school/vendor balance). */
export async function createDeskOrder(input: CreateInput): Promise<{ id: string }> {
  const total = linesTotal(input.lines);
  const amountPaid = paidAtSale(input.buyerType, total);

  const order = await db.$transaction(async (tx) => {
    const customerId = input.buyerType === "individual" && input.customer
      ? await upsertCustomer(tx, input.customer.phone, input.customer.name)
      : null;
    const created = await tx.order.create({
      data: {
        channel: "offline",
        buyerType: input.buyerType,
        status: "delivered",
        userId: null,
        schoolId: input.buyerType === "school" ? input.schoolId ?? null : null,
        vendorId: input.buyerType === "vendor" ? input.vendorId ?? null : null,
        customerId,
        paymentMethod: input.paymentMethod ?? null,
        amountPaid,
        creditOverrideById: input.creditOverrideById ?? null,
        recordedById: input.staffId ?? null,
        notes: input.notes ?? null,
        subtotal: total,
        discountAmount: 0,
        shippingAmount: 0,
        total,
        items: { create: itemRows(input.lines) },
        payments: { create: paymentRows(amountPaid, input.paymentMethod) },
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

    const credit = total - amountPaid;
    if (input.buyerType === "school" && input.schoolId) {
      await tx.school.update({
        where: { id: input.schoolId },
        data: { balance: { increment: credit } },
      });
    }
    if (input.buyerType === "vendor" && input.vendorId) {
      await tx.vendor.update({
        where: { id: input.vendorId },
        data: { balance: { increment: credit } },
      });
    }

    return created;
  }, TX_OPTS);

  revalidateTag("products", "max");
  return order;
}

type UpdateInput = {
  id: string;
  lines: ResolvedLine[];
  paymentMethod?: string | null;
  notes?: string | null;
  staffId?: string | null;
  customer?: { name: string | null; phone: string | null } | null;
};

/** Replace the line items of an offline/school order and reconcile stock + school balance. */
export async function updateDeskOrder(input: UpdateInput): Promise<void> {
  const newTotal = linesTotal(input.lines);

  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: input.id },
      select: {
        channel: true, buyerType: true, status: true, total: true, schoolId: true, vendorId: true,
        amountPaid: true, paymentMethod: true,
        items: { select: { productId: true, variantId: true, qty: true } },
        _count: { select: { returns: true } },
      },
    });
    if (!existing) throw new DeskOrderError("Order not found.");
    if (existing.channel === "online") throw new DeskOrderError("Online orders cannot be edited here.");
    if (existing.status === "cancelled") throw new DeskOrderError("This entry is cancelled.");
    // Line items are replaced wholesale on edit, which would orphan return records.
    if (existing._count.returns > 0) throw new DeskOrderError("This entry has returns recorded and can no longer be edited.");

    const individual = existing.buyerType === "individual";
    const amountPaid = individual ? newTotal : existing.amountPaid;
    const method = input.paymentMethod ?? existing.paymentMethod;
    const customerId = individual && input.customer
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
    if (individual) await tx.orderPayment.deleteMany({ where: { orderId: input.id } });
    await tx.order.update({
      where: { id: input.id },
      data: {
        subtotal: newTotal,
        total: newTotal,
        amountPaid,
        paymentMethod: method,
        notes: input.notes ?? undefined,
        ...(customerId !== undefined ? { customerId } : {}),
        items: { create: itemRows(input.lines) },
        ...(individual ? { payments: { create: paymentRows(amountPaid, method) } } : {}),
      },
    });

    const delta = newTotal - existing.total;
    if (delta !== 0) {
      if (existing.buyerType === "school" && existing.schoolId) {
        await tx.school.update({
          where: { id: existing.schoolId },
          data: { balance: { increment: delta } },
        });
      }
      if (existing.buyerType === "vendor" && existing.vendorId) {
        await tx.vendor.update({
          where: { id: existing.vendorId },
          data: { balance: { increment: delta } },
        });
      }
    }
  }, TX_OPTS);

  revalidateTag("products", "max");
}

/** Soft-cancel an offline/school order: reverse stock + school balance, keep the row. */
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
    const credit = existing.total - existing.amountPaid;

    await applyStockMovements(
      tx,
      movementsFromLines(existing.items, {
        direction: 1, reason: "cancellation", refType: null, refId: id,
        userId: staffId ?? null, note: "sale cancelled",
      }),
    );

    await tx.order.update({ where: { id }, data: { status: "cancelled" } });

    if (existing.buyerType === "school" && existing.schoolId) {
      await tx.school.update({
        where: { id: existing.schoolId },
        data: { balance: { decrement: credit } },
      });
    }
    if (existing.buyerType === "vendor" && existing.vendorId) {
      await tx.vendor.update({
        where: { id: existing.vendorId },
        data: { balance: { decrement: credit } },
      });
    }
  }, TX_OPTS);

  revalidateTag("products", "max");
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
