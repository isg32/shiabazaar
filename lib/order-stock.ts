import { revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { applyStockMovements, movementExists, movementsFromLines } from "@/lib/inventory";

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * Serialize concurrent stock settlement for one order. `/api/orders/verify` and
 * the Razorpay webhook can fire for the same order at the same time; taking a
 * row lock on the order makes the subsequent `movementExists` check
 * authoritative (the `stock_movements` unique index does NOT protect rows with
 * a NULL variantId, i.e. every variant-less product).
 */
async function lockOrder(tx: Prisma.TransactionClient, orderId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "orders" WHERE id = ${orderId} FOR UPDATE`;
  return rows.length > 0;
}

/**
 * Decrement on-hand stock for an online order that has just been paid.
 * Idempotent — safe to call from both `/api/orders/verify` and the Razorpay
 * webhook, and on webhook replay. No-ops if the order has no items or the
 * `online_sale` movement was already recorded.
 */
export async function decrementStockForPaidOrder(orderId: string): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      if (!(await lockOrder(tx, orderId))) return;
      if (await movementExists(tx, { refType: "order", refId: orderId, reason: "online_sale" })) return;
      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { productId: true, variantId: true, qty: true },
      });
      if (items.length === 0) return;
      await applyStockMovements(
        tx,
        movementsFromLines(items, { direction: -1, reason: "online_sale", refId: orderId }),
      );
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err; // lost the race; the other writer applied it
  }
  revalidateTag("products", "max");
}

/**
 * Mark a captured online order as fully paid (`amountPaid` + one `online`
 * OrderPayment). Idempotent across `/api/orders/verify`, the webhook and replays.
 */
export async function recordOnlinePayment(orderId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    if (!(await lockOrder(tx, orderId))) return;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { total: true, amountPaid: true, channel: true },
    });
    if (!order || order.channel !== "online" || order.amountPaid > 0) return;
    await tx.order.update({
      where: { id: orderId },
      data: { amountPaid: order.total, payments: { create: { method: "online", amount: order.total } } },
    });
  });
}

/**
 * Restore stock for an online order cancelled / failed after payment already
 * decremented it. Idempotent — only reverses when an `online_sale` movement
 * exists and no `cancellation` reversal has been recorded yet.
 */
export async function restockForCancelledOrder(orderId: string): Promise<void> {
  try {
    await db.$transaction(async (tx) => {
      if (!(await lockOrder(tx, orderId))) return;
      const sold = await movementExists(tx, { refType: "order", refId: orderId, reason: "online_sale" });
      if (!sold) return;
      const reversed = await movementExists(tx, { refType: "order", refId: orderId, reason: "cancellation" });
      if (reversed) return;
      const items = await tx.orderItem.findMany({
        where: { orderId },
        select: { productId: true, variantId: true, qty: true },
      });
      if (items.length === 0) return;
      await applyStockMovements(
        tx,
        movementsFromLines(items, { direction: 1, reason: "cancellation", refId: orderId }),
      );
    });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
  }
  revalidateTag("products", "max");
}
