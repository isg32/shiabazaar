import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Gift, Sparkles, Crown } from "lucide-react";
import type { ElementType } from "react";
import { ScrollBook } from "@/components/shared/ScrollBook";

const catMeta: Record<string, { Icon: ElementType; color: string }> = {
  books:  { Icon: BookOpen,  color: "#cc785c" },
  gifts:  { Icon: Gift,      color: "#e8a55a" },
  ladies: { Icon: Sparkles,  color: "#5db8a6" },
  gents:  { Icon: Crown,     color: "#8b7fc7" },
};
import { homepageFeatured, categories, trustSignals } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";

const W = "https://shiabazaar.com/wp-content/uploads";

const marqueeItems = [
  "Nahjul Balagha",
  "Tafseer e Namoona",
  "Tafseer e Saafi",
  "Alam Panja",
  "Alam Patka",
  "Mashak Brass",
  "Aadab e Islami",
  "Aadab e Haramain",
  "Tazeem Publication",
  "Islamic Books",
  "Religious Gifts",
  "Mugs & Keychains",
  "Ladies Collection",
  "Gents Collection",
];

export default function HomePage() {
  return (
    <>
      {/* ── Brand header ─────────────────────────── */}
      <section id="brand-header" className="bg-canvas flex flex-col items-center justify-center text-center px-6 py-20 lg:py-28">
        {/* Star icon */}
        <svg viewBox="0 0 100 100" className="w-12 h-12 mb-8 text-accent-amber" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="25" y="25" width="50" height="50" />
          <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="8" />
        </svg>

        {/* Wordmark */}
        <h1
          className="text-ink font-normal mb-3"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 8vw, 72px)",
            letterSpacing: "0.28em",
            lineHeight: 1.1,
          }}
        >
          SHIA BAZAAR
        </h1>

        {/* Sub-brand */}
        <p
          className="text-accent-amber font-medium mb-6"
          style={{ fontSize: "11px", letterSpacing: "0.32em" }}
        >
          TANZEEMUL MAKATIB
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-16 bg-accent-amber/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
          <div className="h-px w-16 bg-accent-amber/60" />
        </div>

        {/* Tagline */}
        <p
          className="text-muted lg:w-80 leading-relaxed"
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "clamp(15px, 2vw, 17px)",
          }}
        >
          A curated collection of Shia Islamic literature, meaningful gifts,
          and essentials — crafted for the faithful.
        </p>
      </section>

      {/* ── Hero — 2 images, no text ──────────────── */}
      <section className="bg-surface-soft">
        <div className="max-w-[1200px] mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 lg:gap-5 lg:h-[560px]">
            {/* Landscape image */}
            <div className="relative overflow-hidden rounded-xl aspect-video lg:aspect-auto">
              <Image
                src={`${W}/2026/05/file_00000000ab6c7208899e7d70e3e33471.png`}
                alt="Shia Bazaar — Islamic books and gifts"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
            {/* Portrait 3:4 image */}
            <div className="relative overflow-hidden rounded-xl aspect-[3/4] lg:aspect-auto">
              <Image
                src={`${W}/2026/06/Gemini_Generated_Image_-3.png`}
                alt="Shia Bazaar — curated collection"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee strip ────────────────────────── */}
      <div className="bg-surface-soft overflow-hidden py-3 border-y border-hairline">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-4 px-4 text-sm font-medium text-body">
              <span className="text-primary text-base leading-none">✦</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Geometric divider ────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Category tile grid ───────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Browse by Category</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap">
            All products <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const meta = catMeta[cat.slug];
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group bg-canvas border border-hairline rounded-xl p-6 hover:border-primary/40 hover:bg-surface-card transition-all flex flex-col items-center text-center"
              >
                {meta && (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${meta.color}1a` }}
                  >
                    <meta.Icon size={32} style={{ color: meta.color }} />
                  </div>
                )}
                <p className="text-sm font-medium text-ink">{cat.label}</p>
                <p className="text-xs text-body mt-1 leading-snug">{cat.description}</p>
                <p className="text-xs text-primary mt-3 font-medium">{cat.count} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Geometric divider ────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Featured products ────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Featured Products</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {homepageFeatured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ── Coral callout card ───────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-section">
        <div className="bg-primary rounded-xl overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            <div className="px-10 py-12 lg:px-12 lg:py-16 flex flex-col justify-center gap-5">
              <p className="text-xs font-medium uppercase tracking-[1.5px] text-on-primary/70">
                New Arrivals
              </p>
              <h2 className="display-sm text-on-primary">
                Explore Our Latest Collection of Islamic Books
              </h2>
              <p className="text-sm text-on-primary/80 leading-relaxed lg:w-80">
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
            <div className="min-h-[280px] lg:min-h-0" style={{ background: "rgba(169,88,62,0.2)" }}>
              <ScrollBook />
            </div>
          </div>
        </div>
      </section>

      {/* ── Geometric divider ────────────────────── */}
      <div className="geometric-divider" />

      {/* ── Trust signals ────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustSignals.map((signal) => (
            <div
              key={signal.title}
              className="bg-surface-card rounded-xl p-6 flex flex-col gap-3 min-w-0"
            >
              <span className="text-2xl">{signal.icon}</span>
              <p className="text-sm font-medium text-ink">{signal.title}</p>
              <p className="text-xs text-body leading-snug">{signal.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
