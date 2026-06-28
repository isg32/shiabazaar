import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { homepageFeatured, categories, trustSignals, heroBanner, featuredProducts } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";

export default function HomePage() {
  // Coral callout — use first gift product as promo image
  const promoProduct = featuredProducts.find((p) => p.type === "gift");

  return (
    <>
      {/* ── Hero band (dark) ──────────────────────────── */}
      <section className="bg-surface-dark text-on-dark">
        <div className="max-w-[1200px] mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <p className="text-xs font-medium uppercase tracking-[1.5px] text-on-dark-soft">
              Islamic Books & Gifts
            </p>
            <h1 className="display-lg text-on-dark">
              {heroBanner.headline}
            </h1>
            <p className="text-base text-on-dark-soft leading-relaxed max-w-md">
              {heroBanner.subline}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
              >
                Shop Now <ArrowRight size={15} />
              </Link>
              <Link
                href="/category/books"
                className="inline-flex items-center gap-2 h-10 px-5 bg-surface-dark-elevated text-on-dark text-sm font-medium rounded-md hover:bg-surface-dark-soft transition-colors"
              >
                Browse Books
              </Link>
            </div>
          </div>

          {/* Hero — site logo on dark */}
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-dark-elevated border border-white/10 flex items-center justify-center p-10">
            <Image
              src={heroBanner.image}
              alt="Shia Bazaar"
              fill
              className="object-contain p-8"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ── Geometric divider ────────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Category tile grid ───────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Browse by Category</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1">
            All products <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group bg-canvas border border-hairline rounded-xl p-6 hover:border-primary/40 hover:bg-surface-card transition-all"
            >
              <span className="text-3xl block mb-3">{cat.icon}</span>
              <p className="text-sm font-medium text-ink">{cat.label}</p>
              <p className="text-xs text-muted mt-1 leading-snug">{cat.description}</p>
              <p className="text-xs text-primary mt-3 font-medium">{cat.count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Geometric divider ────────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Featured products ─────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Featured Products</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {homepageFeatured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── Coral callout card (with real product image) ── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-section">
        <div className="bg-primary rounded-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="px-10 py-12 lg:px-12 lg:py-16 flex flex-col justify-center gap-6">
              <p className="text-xs font-medium uppercase tracking-[1.5px] text-on-primary/70">
                New Arrivals
              </p>
              <h2 className="display-sm text-on-primary">
                Explore Our Latest Collection of Islamic Books
              </h2>
              <p className="text-sm text-on-primary/80 leading-relaxed max-w-sm">
                New titles added weekly — scholarly works, duas, history, and
                books for the whole family.
              </p>
              <Link
                href="/products?sort=newest"
                className="self-start inline-flex items-center gap-2 h-10 px-5 bg-canvas text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors"
              >
                Shop New Arrivals <ArrowRight size={15} />
              </Link>
            </div>
            {/* Real product image from shiabazaar.com */}
            <div className="relative min-h-[280px] lg:min-h-0 bg-primary-active/20 flex items-center justify-center p-8">
              {promoProduct && (
                <Image
                  src={promoProduct.coverImage}
                  alt={promoProduct.title}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Geometric divider ────────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Trust signals ─────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="bg-surface-card rounded-xl p-6 flex flex-col gap-3"
            >
              <span className="text-2xl">{signal.icon}</span>
              <p className="text-sm font-medium text-ink">{signal.title}</p>
              <p className="text-xs text-muted leading-snug">{signal.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
