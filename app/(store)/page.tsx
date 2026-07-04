import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Gift, Sparkles, Crown } from "lucide-react";
import type { ElementType } from "react";
import { ScrollBook } from "@/components/shared/ScrollBook";
import { FadeIn } from "@/components/shared/FadeIn";
import { getFeaturedProducts } from "@/lib/queries";
import { ProductCard } from "@/components/shared/ProductCard";
import { db } from "@/lib/db";
import { HomepagePopup } from "@/components/shared/HomepagePopup";

export const dynamic = "force-dynamic";

const catMeta: Record<string, { Icon: ElementType; color: string; description: string; slug: string; label: string }> = {
  book:   { slug: "books",  label: "Islamic Books", Icon: BookOpen,  color: "#cc785c", description: "Quran, tafsir, fiqh, history & duas" },
  gift:   { slug: "gifts",  label: "Gifts",         Icon: Gift,      color: "#e8a55a", description: "Alam, mashak, mugs, lamps & more" },
  ladies: { slug: "ladies", label: "Ladies",        Icon: Sparkles,  color: "#5db8a6", description: "Curated picks for women" },
  gents:  { slug: "gents",  label: "Gents",         Icon: Crown,     color: "#8b7fc7", description: "Curated picks for men" },
};

const trustSignals = [
  { icon: "🚚", title: "Free Shipping",      description: "On orders above ₹500" },
  { icon: "🔒", title: "Secure Payments",    description: "Razorpay protected checkout" },
  { icon: "↩️", title: "Easy Returns",       description: "7-day hassle-free returns" },
  { icon: "📦", title: "Careful Packaging",  description: "Books packed to prevent damage" },
];

const marqueeItems = [
  "Nahjul Balagha", "Tafseer e Namoona", "Tafseer e Saafi",
  "Alam Panja", "Alam Patka", "Mashak Brass",
  "Aadab e Islami", "Aadab e Haramain", "Tazeem Publication",
  "Islamic Books", "Religious Gifts", "Mugs & Keychains",
  "Ladies Collection", "Gents Collection",
];

const W = "https://shiabazaar.com/wp-content/uploads";

export default async function HomePage() {
  const [featured, banners, categoryCounts, activePopup] = await Promise.all([
    getFeaturedProducts(8),
    db.banner.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    db.product.groupBy({ by: ["type"], _count: { id: true } }),
    db.popup.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const countMap = Object.fromEntries(categoryCounts.map(r => [r.type, r._count.id]));

  // Use first DB banner for hero if available
  const heroBanner = banners[0] ?? null;

  return (
    <>
      {/* ── Brand header ─────────────────────────── */}
      <section id="brand-header" className="bg-canvas flex flex-col items-center justify-center text-center px-6 py-20 lg:py-28">
        <svg viewBox="0 0 100 100" className="w-12 h-12 mb-8 text-accent-amber" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="25" y="25" width="50" height="50" />
          <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="8" />
        </svg>
        <h1
          className="text-ink font-normal mb-3"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 8vw, 72px)", letterSpacing: "0.28em", lineHeight: 1.1 }}
        >
          SHIA BAZAAR
        </h1>
        <p className="text-accent-amber font-medium mb-6" style={{ fontSize: "11px", letterSpacing: "0.32em" }}>
          TANZEEMUL MAKATIB
        </p>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-16 bg-accent-amber/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-amber" />
          <div className="h-px w-16 bg-accent-amber/60" />
        </div>
        <p className="text-muted lg:w-80 leading-relaxed" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(15px, 2vw, 17px)" }}>
          A curated collection of Shia Islamic literature, meaningful gifts,
          and essentials — crafted for the faithful.
        </p>
      </section>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="bg-surface-soft">
        <div className="max-w-[1200px] mx-auto px-6 py-10 lg:py-14">
          {heroBanner ? (
            /* DB banner */
            <div className="relative overflow-hidden rounded-xl bg-surface-dark min-h-[400px] flex items-center">
              {heroBanner.imageUrl && (
                <Image
                  src={heroBanner.imageUrl}
                  alt={heroBanner.title}
                  fill
                  className="object-cover opacity-40"
                  priority
                  sizes="100vw"
                />
              )}
              <div className="relative z-10 px-10 py-14 lg:px-16 flex flex-col gap-5 max-w-xl">
                <h2 className="text-on-dark" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.1 }}>
                  {heroBanner.title}
                </h2>
                {heroBanner.subtitle && (
                  <p className="text-on-dark-soft text-sm leading-relaxed">{heroBanner.subtitle}</p>
                )}
                <Link
                  href={heroBanner.ctaUrl}
                  className="self-start inline-flex items-center gap-2 h-10 px-5 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
                >
                  {heroBanner.ctaLabel} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            /* Static fallback images */
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 lg:gap-5 lg:h-[560px]">
              <div className="relative overflow-hidden rounded-xl aspect-video lg:aspect-auto">
                <Image src={`${W}/2026/05/file_00000000ab6c7208899e7d70e3e33471.png`} alt="Shia Bazaar — Islamic books and gifts" fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 60vw" />
              </div>
              <div className="relative overflow-hidden rounded-xl aspect-[3/4] lg:aspect-auto">
                <Image src={`${W}/2026/06/Gemini_Generated_Image_-3.png`} alt="Shia Bazaar — curated collection" fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 40vw" />
              </div>
            </div>
          )}
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

      <div className="geometric-divider" />

      {/* ── Category tile grid ───────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <FadeIn className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Browse by Category</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap">
            All products <ArrowRight size={14} />
          </Link>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(catMeta).map(([type, meta], i) => (
            <FadeIn key={type} delay={i * 70}>
              <Link
                href={`/category/${meta.slug}`}
                className="group bg-canvas border border-hairline rounded-xl p-6 hover:border-primary/40 hover:bg-surface-card transition-all flex flex-col items-center text-center h-full"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${meta.color}1a` }}>
                  <meta.Icon size={32} style={{ color: meta.color }} />
                </div>
                <p className="text-sm font-medium text-ink">{meta.label}</p>
                <p className="text-xs text-body mt-1 leading-snug">{meta.description}</p>
                <p className="text-xs text-primary mt-3 font-medium">{countMap[type] ?? 0} items</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="geometric-divider" />

      {/* ── Featured products ────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <FadeIn className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Featured Products</h2>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap">
            View all <ArrowRight size={14} />
          </Link>
        </FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((product, i) => (
            <FadeIn key={product.id} delay={i * 60}>
              <ProductCard product={product} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Coral callout card ───────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pb-section">
        <FadeIn>
          <div className="bg-primary rounded-xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="px-10 py-12 lg:px-12 lg:py-16 flex flex-col justify-center gap-5">
                <p className="text-xs font-medium uppercase tracking-[1.5px] text-on-primary/70">New Arrivals</p>
                <h2 className="display-sm text-on-primary">Explore Our Latest Collection of Islamic Books</h2>
                <p className="text-sm text-on-primary/80 leading-relaxed lg:w-80">
                  New titles added weekly — scholarly works, duas, history, and books for the whole family.
                </p>
                <Link href="/products?sort=newest" className="self-start inline-flex items-center gap-2 h-10 px-5 bg-canvas text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
                  Shop New Arrivals <ArrowRight size={15} />
                </Link>
              </div>
              <div className="min-h-[280px] lg:min-h-0" style={{ background: "rgba(169,88,62,0.2)" }}>
                <ScrollBook />
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <div className="geometric-divider" />

      {/* ── Trust signals ────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {trustSignals.map((signal, i) => (
            <FadeIn key={signal.title} delay={i * 80} className="bg-surface-card rounded-xl p-6 flex flex-col gap-3 min-w-0">
              <span className="text-2xl">{signal.icon}</span>
              <p className="text-sm font-medium text-ink">{signal.title}</p>
              <p className="text-xs text-body leading-snug">{signal.description}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Popup ────────────────────────────────── */}
      {activePopup && <HomepagePopup popup={activePopup} />}
    </>
  );
}
