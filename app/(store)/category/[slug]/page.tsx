import { notFound } from "next/navigation";
import { featuredProducts, categories } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return {};
  return { title: cat.label, description: cat.description };
}

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

const typeMap: Record<string, string> = {
  books: "book",
  gifts: "gift",
  ladies: "ladies",
  gents: "gents",
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const products = featuredProducts.filter((p) => p.type === typeMap[slug]);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <span className="text-4xl block mb-3">{cat.icon}</span>
        <h1 className="display-md text-ink">{cat.label}</h1>
        <p className="text-muted mt-2 text-sm">{cat.description} · {products.length || cat.count} products</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-24 text-muted">
          <p className="text-lg">No products yet in this category.</p>
          <p className="text-sm mt-2">Check back soon.</p>
        </div>
      )}
    </div>
  );
}
