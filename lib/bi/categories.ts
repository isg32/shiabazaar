import { db } from "@/lib/db";
import type { CategoryOption } from "@/components/dashboard/FilterBar";

/** Every active category as "Parent › Child" options, ordered as a tree, for the filter bar. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  const cats = await db.category.findMany({ select: { id: true, name: true, parentId: true, position: true }, orderBy: [{ position: "asc" }, { name: "asc" }] });
  const children = new Map<string | null, typeof cats>();
  for (const c of cats) children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
  const out: CategoryOption[] = [];
  const walk = (parent: string | null, prefix: string) => {
    for (const c of children.get(parent) ?? []) {
      const label = prefix ? `${prefix} › ${c.name}` : c.name;
      out.push({ id: c.id, label });
      walk(c.id, label);
    }
  };
  walk(null, "");
  return out;
}
