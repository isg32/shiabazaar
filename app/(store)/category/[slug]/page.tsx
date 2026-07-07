import { notFound } from "next/navigation";
import { getProducts, getProductsByCategoryId } from "@/lib/queries";
import { CollectionView } from "@/components/shared/CollectionView";
import { db } from "@/lib/db";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

// Hardcoded top-level slugs — filter by product type
const TYPE_SLUGS: Record<string, { label: string; type: string }> = {
  "books":        { label: "Islamic Books",   type: "book" },
  "gifts":        { label: "Gifts",           type: "gift" },
  "ladies":       { label: "Ladies",          type: "ladies" },
  "gents":        { label: "Gents",           type: "gents" },
  "other-products": { label: "Other Products", type: "ladies" }, // ponytail: shows ladies+gents combined below
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (TYPE_SLUGS[slug]) return { title: TYPE_SLUGS[slug].label };
  if (slug === "tazeem-publication") return { title: "Tazeem Publication" };
  if (slug === "other-publications") return { title: "Other Publications" };
  const cat = await db.category.findUnique({ where: { slug }, select: { name: true } });
  return cat ? { title: cat.name } : {};
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  // Tazeem Publication: books where publisher contains "tazeem"
  if (slug === "tazeem-publication") {
    const products = await getProducts({ type: "book", publisherContains: "tazeem", limit: 200 });
    return (
      <CollectionView
        label="Tazeem Publication"
        crumbs={[{ label: "Home", href: "/" }, { label: "Tazeem Publication" }]}
        products={products}
      />
    );
  }

  // Other Publications: books where publisher does NOT contain "tazeem"
  if (slug === "other-publications") {
    const products = await getProducts({ type: "book", publisherNotContains: "tazeem", limit: 200 });
    return (
      <CollectionView
        label="Other Publications"
        crumbs={[{ label: "Home", href: "/" }, { label: "Other Publications" }]}
        products={products}
      />
    );
  }

  // "Other Products": ladies + gents combined
  if (slug === "other-products") {
    const [ladies, gents] = await Promise.all([
      getProducts({ type: "ladies", limit: 200 }),
      getProducts({ type: "gents", limit: 200 }),
    ]);
    return (
      <CollectionView
        label="Other Products"
        crumbs={[{ label: "Home", href: "/" }, { label: "Other Products" }]}
        products={[...ladies, ...gents]}
      />
    );
  }

  // Top-level type slugs
  const typeMeta = TYPE_SLUGS[slug];
  if (typeMeta) {
    const products = await getProducts({ type: typeMeta.type, limit: 200 });
    return (
      <CollectionView
        label={typeMeta.label}
        crumbs={[{ label: "Home", href: "/" }, { label: typeMeta.label }]}
        products={products}
      />
    );
  }

  // Dynamic DB category
  const cat = await db.category.findUnique({ where: { slug } });
  if (!cat) notFound();

  const products = await getProductsByCategoryId(cat.id);
  return (
    <CollectionView
      label={cat.name}
      crumbs={[{ label: "Home", href: "/" }, { label: cat.name }]}
      products={products}
    />
  );
}
