import type { Prisma, StockReason } from "@prisma/client";

/**
 * Shared stock-movement helper. Every channel that changes on-hand stock —
 * online checkout, offline desk sales, school book-issues, manual restock /
 * adjustment — goes through here so there is a single append-only audit trail
 * (`stock_movements`) and `Product.inStock` stays correct automatically.
 *
 * Contract: call inside `db.$transaction(async (tx) => { ... })`. This does NOT
 * revalidate any cache — the caller runs `revalidateTag("products", "max")`
 * AFTER the transaction commits.
 */

type TxClient = Prisma.TransactionClient;

export type MovementInput = {
  productId: string;
  variantId?: string | null;
  /** signed; negative = decrement, positive = increment */
  delta: number;
  reason: StockReason;
  /** "order" | "manual" */
  refType?: string | null;
  /** Order.id for sales / issues; null for manual moves */
  refId?: string | null;
  note?: string | null;
  /** staff/customer User.id responsible for the move */
  userId?: string | null;
};

/**
 * True if a movement already exists for this (refType, refId, reason). Use before
 * applying `online_sale` decrements so a Razorpay `verify` + webhook race (or a
 * webhook replay) doesn't double-count. The `uniq_movement_dedup` unique index is
 * the hard backstop — a duplicate insert throws P2002.
 */
export async function movementExists(
  tx: TxClient,
  key: { refType: string; refId: string; reason: StockReason },
): Promise<boolean> {
  const row = await tx.stockMovement.findFirst({
    where: { refType: key.refType, refId: key.refId, reason: key.reason },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Record one stock movement and apply it to the on-hand count, then reconcile
 * `Product.inStock`. Negative stock is permitted (v1) — the movement is always
 * recorded so the position stays auditable and correctable.
 */
export async function applyStockMovement(tx: TxClient, input: MovementInput): Promise<void> {
  const variantId = input.variantId ?? null;

  await tx.stockMovement.create({
    data: {
      productId: input.productId,
      variantId,
      delta: input.delta,
      reason: input.reason,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      note: input.note ?? null,
      userId: input.userId ?? null,
    },
  });

  if (variantId) {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: input.delta } },
    });
  } else {
    await tx.product.update({
      where: { id: input.productId },
      data: { stock: { increment: input.delta } },
    });
  }

  // Reconcile the storefront availability flag. For variant products, available
  // = any variant has stock; otherwise = product on-hand > 0.
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    select: { inStock: true, stock: true, variants: { select: { stock: true } } },
  });
  if (!product) return;

  const available =
    product.variants.length > 0
      ? product.variants.some((v) => v.stock > 0)
      : product.stock > 0;

  if (available !== product.inStock) {
    await tx.product.update({
      where: { id: input.productId },
      data: { inStock: available },
    });
  }
}

/** Apply several movements in sequence within the same transaction. */
export async function applyStockMovements(tx: TxClient, inputs: MovementInput[]): Promise<void> {
  for (const input of inputs) {
    await applyStockMovement(tx, input);
  }
}

/**
 * Collapse order lines to one movement per (productId, variantId).
 *
 * `refType` defaults to `"order"` — use that for the ONE authoritative movement
 * set of an order (online sale, offline sale, school issue); the
 * `uniq_movement_dedup` index then blocks a second identical set. For later
 * compensating moves on the same order (edits, cancellations) pass
 * `refType: null` so repeated adjustments to the same order don't collide.
 */
export function movementsFromLines(
  lines: { productId: string; variantId?: string | null; qty: number }[],
  opts: {
    direction: 1 | -1;
    reason: StockReason;
    refId: string;
    refType?: string | null;
    userId?: string | null;
    note?: string | null;
  },
): MovementInput[] {
  const refType = opts.refType === undefined ? "order" : opts.refType;
  const byKey = new Map<string, MovementInput>();
  for (const line of lines) {
    const variantId = line.variantId ?? null;
    const key = `${line.productId}::${variantId ?? ""}`;
    const existing = byKey.get(key);
    const delta = opts.direction * line.qty;
    if (existing) {
      existing.delta += delta;
    } else {
      byKey.set(key, {
        productId: line.productId,
        variantId,
        delta,
        reason: opts.reason,
        refType,
        refId: opts.refId,
        userId: opts.userId ?? null,
        note: opts.note ?? null,
      });
    }
  }
  return [...byKey.values()];
}
