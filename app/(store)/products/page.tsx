import { featuredProducts } from "@/data/mock";
import { CollectionView } from "@/components/shared/CollectionView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

export default function ProductsPage() {
  return (
    <CollectionView
      label="All Products"
      crumbs={[{ label: "Home", href: "/" }, { label: "All Products" }]}
      products={featuredProducts}
    />
  );
}
