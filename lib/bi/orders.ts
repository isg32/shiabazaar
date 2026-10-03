import type { Prisma } from "@prisma/client";
import { COUNTED_SALE } from "./core";
import { categorySubtree } from "./facts";
import type { DashFilters } from "./filters";

/** Prisma where-clause for orders under the dashboard filters (used by the transaction list). */
export async function orderWhere(f: DashFilters): Promise<Prisma.OrderWhereInput> {
  const and: Prisma.OrderWhereInput[] = [COUNTED_SALE, { createdAt: { gte: f.period.from, lt: f.period.to } }];
  if (f.channel) and.push({ channel: f.channel });
  if (f.buyer) and.push({ buyerType: f.buyer });
  if (f.category) {
    const ids = await categorySubtree(f.category);
    and.push({ items: { some: { product: { categories: { some: { categoryId: { in: ids } } } } } } });
  }
  return { AND: and };
}

export function buyerName(o: {
  buyerType: string;
  school: { name: string; code: string | null } | null;
  vendor: { name: string; code: string | null } | null;
  customer: { name: string | null; phone: string } | null;
  user: { name: string | null; email: string } | null;
}): string {
  if (o.buyerType === "school" && o.school) return `${o.school.name}${o.school.code ? ` (${o.school.code})` : ""}`;
  if (o.buyerType === "vendor" && o.vendor) return `${o.vendor.name}${o.vendor.code ? ` (${o.vendor.code})` : ""}`;
  if (o.customer) return o.customer.name ? `${o.customer.name} · ${o.customer.phone}` : o.customer.phone;
  if (o.user) return o.user.name || o.user.email;
  return "Walk-in";
}
