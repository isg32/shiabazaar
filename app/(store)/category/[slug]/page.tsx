import { notFound } from "next/navigation";
import { featuredProducts } from "@/data/mock";
import { CollectionView } from "@/components/shared/CollectionView";
import type { Metadata } from "next";
import type { Product } from "@/data/mock";

interface Props { params: Promise<{ slug: string }> }

const collectionMeta: Record<string, { label: string }> = {
  "books":               { label: "Islamic Books" },
  "gifts":               { label: "Gifts" },
  "ladies":              { label: "Ladies" },
  "gents":               { label: "Gents" },
  "tazeem-publication":  { label: "Tazeem Publication" },
  "other-publications":  { label: "Other Publications" },
  "other-products":      { label: "Other Products" },
};

const productFilter: Record<string, (p: Product) => boolean> = {
  "books":               (p) => p.type === "book",
  "gifts":               (p) => p.type === "gift",
  "ladies":              (p) => p.type === "ladies",
  "gents":               (p) => p.type === "gents",
  "tazeem-publication":  (p) => p.type === "book",
  "other-publications":  (p) => p.type === "book",
  "other-products":      (p) => p.type === "ladies" || p.type === "gents",
};

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

  const filter = productFilter[slug] ?? (() => false);
  const products = featuredProducts.filter(filter);

  return (
    <CollectionView
      label={meta.label}
      crumbs={[{ label: "Home", href: "/" }, { label: meta.label }]}
      products={products}
    />
  );
}
