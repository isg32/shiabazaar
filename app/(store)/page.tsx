import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredProducts, categories, trustSignals } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";

export default function HomePage() {
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
              Knowledge, Faith &amp; Meaning — Delivered to Your Door
            </h1>
            <p className="text-base text-on-dark-soft leading-relaxed max-w-md">
              A thoughtfully curated store for the Shia community — from sacred
              texts and scholarly works to meaningful everyday gifts.
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

          {/* Hero image placeholder — admin-controlled in later phases */}
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-surface-dark-elevated border border-white/10 flex items-center justify-center">
            <div className="text-center text-on-dark-soft">
              <p className="font-display text-4xl font-normal tracking-tight text-on-dark" style={{ fontFamily: "var(--font-display)" }}>
                Shia Bazaar
              </p>
              <p className="text-sm mt-2">Hero banner — admin configurable</p>
            </div>
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
          {featuredProducts.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── Coral callout card (with image) ──────────── */}
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
                children&apos;s Islamic books for the whole family.
              </p>
              <Link
                href="/products?sort=newest"
                className="self-start inline-flex items-center gap-2 h-10 px-5 bg-canvas text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors"
              >
                Shop New Arrivals <ArrowRight size={15} />
              </Link>
            </div>
            {/* Promo image */}
            <div className="relative min-h-[240px] lg:min-h-0 bg-primary-active/30 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-white/10">
              <p className="text-on-primary/50 text-sm">Promo image — admin configurable</p>
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
