import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { applyStockMovements, movementsFromLines } from "@/lib/inventory";
import type { BuyerType } from "@prisma/client";

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
  price: number; // paise, snapshot
};

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

    let paise = variantPrice ?? p.price;
    if (l.unitPrice !== undefined && l.unitPrice !== null && l.unitPrice !== "") {
      const rupees = Number(l.unitPrice);
      if (!Number.isFinite(rupees) || rupees < 0) {
        throw new DeskOrderError(`Line ${idx + 1}: price must be a non-negative number.`);
      }
      paise = Math.round(rupees * 100);
    }

    return { productId: p.id, variantId, qty, title: p.title, price: paise };
  });
}

export function linesTotal(lines: ResolvedLine[]): number {
  return lines.reduce((s, l) => s + l.price * l.qty, 0);
}

type CreateInput = {
  buyerType: BuyerType;
  lines: ResolvedLine[];
  paymentMethod?: string | null;
  schoolId?: string | null;
  vendorId?: string | null;
  notes?: string | null;
  staffId?: string | null;
};

/** Create an offline sale / school issue / vendor issue: order + items + stock draw-down (+ school/vendor balance). */
export async function createDeskOrder(input: CreateInput): Promise<{ id: string }> {
  const total = linesTotal(input.lines);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        channel: "offline",
        buyerType: input.buyerType,
        status: "delivered",
        userId: null,
        schoolId: input.buyerType === "school" ? input.schoolId ?? null : null,
        vendorId: input.buyerType === "vendor" ? input.vendorId ?? null : null,
        paymentMethod: input.paymentMethod ?? null,
        recordedById: input.staffId ?? null,
        notes: input.notes ?? null,
        subtotal: total,
        discountAmount: 0,
        shippingAmount: 0,
        total,
        items: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            price: l.price,
            qty: l.qty,
          })),
        },
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

    if (input.buyerType === "school" && input.schoolId) {
      await tx.school.update({
        where: { id: input.schoolId },
        data: { balance: { increment: total } },
      });
    }
    if (input.buyerType === "vendor" && input.vendorId) {
      await tx.vendor.update({
        where: { id: input.vendorId },
        data: { balance: { increment: total } },
      });
    }

    return created;
  });

  revalidateTag("products", "max");
  return order;
}

type UpdateInput = {
  id: string;
  lines: ResolvedLine[];
  paymentMethod?: string | null;
  notes?: string | null;
  staffId?: string | null;
};

/** Replace the line items of an offline/school order and reconcile stock + school balance. */
export async function updateDeskOrder(input: UpdateInput): Promise<void> {
  const newTotal = linesTotal(input.lines);

  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id: input.id },
      select: {
        channel: true, buyerType: true, status: true, total: true, schoolId: true, vendorId: true,
        items: { select: { productId: true, variantId: true, qty: true } },
      },
    });
    if (!existing) throw new DeskOrderError("Order not found.");
    if (existing.channel === "online") throw new DeskOrderError("Online orders cannot be edited here.");
    if (existing.status === "cancelled") throw new DeskOrderError("This entry is cancelled.");

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
    await tx.order.update({
      where: { id: input.id },
      data: {
        subtotal: newTotal,
        total: newTotal,
        paymentMethod: input.paymentMethod ?? undefined,
        notes: input.notes ?? undefined,
        items: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            title: l.title,
            price: l.price,
            qty: l.qty,
          })),
        },
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
  });

  revalidateTag("products", "max");
}

/** Soft-cancel an offline/school order: reverse stock + school balance, keep the row. */
export async function cancelDeskOrder(id: string, staffId?: string | null): Promise<void> {
  await db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({
      where: { id },
      select: {
        channel: true, buyerType: true, status: true, total: true, schoolId: true, vendorId: true,
        items: { select: { productId: true, variantId: true, qty: true } },
      },
    });
    if (!existing) throw new DeskOrderError("Order not found.");
    if (existing.channel === "online") throw new DeskOrderError("Online orders cannot be cancelled here.");
    if (existing.status === "cancelled") return;

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
        data: { balance: { decrement: existing.total } },
      });
    }
    if (existing.buyerType === "vendor" && existing.vendorId) {
      await tx.vendor.update({
        where: { id: existing.vendorId },
        data: { balance: { decrement: existing.total } },
      });
    }
  });

  revalidateTag("products", "max");
}

/** Narrow a JSON body's optional string field. */
export function optionalString(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
