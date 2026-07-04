import { notFound } from "next/navigation";
import { getProducts } from "@/lib/queries";
import { CollectionView } from "@/components/shared/CollectionView";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

const collectionMeta: Record<string, { label: string; type?: string }> = {
  "books":              { label: "Islamic Books",       type: "book" },
  "gifts":              { label: "Gifts",               type: "gift" },
  "ladies":             { label: "Ladies",              type: "ladies" },
  "gents":              { label: "Gents",               type: "gents" },
  "tazeem-publication": { label: "Tazeem Publication",  type: "book" },
  "other-publications": { label: "Other Publications",  type: "book" },
  "other-products":     { label: "Other Products" },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = collectionMeta[slug];
  return meta ? { title: meta.label } : {};
}

export async function generateStaticParams() {
  return Object.keys(collectionMeta).map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const meta = collectionMeta[slug];
  if (!meta) notFound();

  const products = await getProducts({ type: meta.type, limit: 200 });

  return (
    <CollectionView
      label={meta.label}
      crumbs={[{ label: "Home", href: "/" }, { label: meta.label }]}
      products={products}
    />
  );
}
