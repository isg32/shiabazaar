import { db } from "./db";

export async function ensureUser(email: string, name?: string | null): Promise<string> {
  const user = await db.user.upsert({
    where: { email },
    create: { email, name: name ?? null },
    update: {},
    select: { id: true },
  });
  return user.id;
}
