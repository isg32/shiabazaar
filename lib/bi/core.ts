import type { Prisma } from "@prisma/client";

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

export { inr } from "./format";
