import { featuredProducts } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";
import { Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // ponytail: server param resolution deferred — shows all products as mock results
  const results = featuredProducts;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Search bar */}
      <div className="relative max-w-xl mb-10">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search books, gifts, authors..."
          defaultValue=""
          className="w-full h-12 pl-10 pr-4 text-sm border border-hairline rounded-xl bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
        />
      </div>

      <p className="text-sm text-muted mb-6">{results.length} results</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
