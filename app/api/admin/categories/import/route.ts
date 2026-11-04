import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const VALID_GROUPS = ["book", "gift", "other"];

type CategoryRow = {
  name: string;
  group?: string;       // required for a top-level row (no parent_name)
  parent_name?: string; // name of a category earlier in this CSV, or already in the DB
  slug?: string;
  position?: string | number;
  active?: string | boolean;
};

type KnownCat = { id: string; name: string; slug: string; group: string };

/**
 * Bulk category import. CREATE-only (like the products importer's default
 * "skip" mode) — a row whose slug already exists is counted as skipped, never
 * updated, so re-running a CSV is always safe. Subcategories are expressed via
 * `parent_name`: rows must be ordered so a parent appears before its children
 * — the row-by-row loop resolves parents strictly against categories already
 * known at that point (existing in the DB, or created earlier in this batch).
 * A subcategory's group is always inherited from its resolved parent (same
 * rule the single-category POST route uses); `group` on a child row is only
 * used to disambiguate when two groups both have a same-named parent.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard.error;

  const { rows }: { rows: CategoryRow[] } = await req.json();

  const existing = await db.category.findMany({ select: { id: true, name: true, slug: true, group: true } });
  const known: KnownCat[] = [...existing];
  const usedSlugs = new Set(existing.map((c) => c.slug));

  let created = 0;
  let skipped = 0;
  const errors: { row: number; name: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = row.name?.trim();
      if (!name) throw new Error("name is required");

      const parentName = row.parent_name?.trim();
      const rowGroup = row.group?.trim().toLowerCase();

      let resolvedGroup: string;
      let parentId: string | null = null;

      if (parentName) {
        const candidates = known.filter(
          (c) => c.name.toLowerCase() === parentName.toLowerCase() && (!rowGroup || c.group === rowGroup)
        );
        if (candidates.length === 0) {
          throw new Error(`parent category "${parentName}" not found — make sure the parent row comes before this one in the CSV`);
        }
        if (candidates.length > 1) {
          throw new Error(`parent category "${parentName}" is ambiguous (exists in more than one group) — add a "group" column to disambiguate`);
        }
        parentId = candidates[0].id;
        resolvedGroup = candidates[0].group;
      } else {
        if (!rowGroup) throw new Error('"group" is required for a top-level category (no parent_name given)');
        if (!VALID_GROUPS.includes(rowGroup)) throw new Error(`unknown group "${row.group}" (must be book, gift, or other)`);
        resolvedGroup = rowGroup;
      }

      const slug = row.slug?.trim() || slugify(name);
      if (usedSlugs.has(slug)) {
        skipped++;
        continue;
      }

      const active = row.active === undefined || row.active === ""
        ? true
        : row.active === true || row.active === "true" || row.active === "1";
      const position = row.position !== undefined && row.position !== "" ? Number(row.position) || 0 : 0;

      const category = await db.category.create({
        data: { name, slug, group: resolvedGroup, parentId, position, active },
        select: { id: true, name: true, slug: true, group: true },
      });

      known.push(category);
      usedSlugs.add(slug);
      created++;
    } catch (err) {
      errors.push({
        row: i + 1,
        name: row.name ?? `row ${i + 1}`,
        error: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  revalidateTag("products", "max");

  return NextResponse.json({ created, skipped, errors }, { status: 201 });
}
