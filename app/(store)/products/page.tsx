import { getProducts } from "@/lib/queries";
import { CollectionView } from "@/components/shared/CollectionView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

export default async function ProductsPage() {
  const products = await getProducts({ limit: 200 });
  return (
    <CollectionView
      label="All Products"
      crumbs={[{ label: "Home", href: "/" }, { label: "All Products" }]}
      products={products}
    />
  );
}
