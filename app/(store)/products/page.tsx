import { featuredProducts, categories } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";
import { Badge } from "@/components/shared/Badge";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Products" };

const filters = {
  category: ["All", "Books", "Gifts", "Ladies", "Gents"],
  language: ["All", "English", "Arabic", "Urdu", "Arabic / English"],
  price: ["All", "Under ₹299", "₹300–₹599", "₹600–₹999", "₹1000+"],
  availability: ["All", "In Stock", "Out of Stock"],
};

export default function ProductsPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="display-md text-ink">All Products</h1>
        <p className="text-muted mt-2 text-sm">{featuredProducts.length} products</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Filters sidebar ──────────────────────── */}
        <aside className="lg:w-56 shrink-0">
          <div className="space-y-6">
            {Object.entries(filters).map(([group, options]) => (
              <div key={group}>
                <p className="text-xs font-medium uppercase tracking-[1.5px] text-muted mb-3">
                  {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, i) => (
                    <button
                      key={opt}
                      className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
                        i === 0
                          ? "bg-surface-cream-strong border-hairline text-ink"
                          : "bg-canvas border-hairline text-muted hover:text-ink hover:bg-surface-card"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Product grid ──────────────────────────── */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="text-xs px-3 py-1.5 rounded-md border border-hairline text-muted hover:text-ink hover:bg-surface-card whitespace-nowrap transition-colors"
                >
                  {c.label}
                </Link>
              ))}
            </div>
            <select className="text-xs border border-hairline rounded-md px-3 py-1.5 bg-canvas text-ink focus:outline-none focus:border-primary">
              <option>Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Best Rated</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
