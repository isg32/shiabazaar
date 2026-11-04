import type { Prisma } from "@prisma/client";

/** Digits only; a 12-digit number with a leading 91 country code is reduced to 10. Null when unusable. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  return d.length >= 6 ? d : null;
}

/** Find-or-create the walk-in customer for a phone, refreshing their name when a new one is given. */
export async function upsertCustomer(
  tx: Prisma.TransactionClient,
  phoneRaw: string | null | undefined,
  name: string | null | undefined,
): Promise<string | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;
  const c = await tx.customer.upsert({
    where: { phone },
    create: { phone, name: name || null },
    update: name ? { name } : {},
    select: { id: true },
  });
  return c.id;
}

/** "Customer: Name · Phone" snapshot line + optional free-text note, as stored on Order.notes. */
export function deskSaleNotes(name: string | null, phone: string | null, note: string | null): string | null {
  const who = [name, phone].filter(Boolean).join(" · ");
  return [who && `Customer: ${who}`, note].filter(Boolean).join("\n") || null;
}
