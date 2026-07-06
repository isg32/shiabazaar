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
import { HomepageNavbar } from "@/components/layout/Navbar";

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
const FALLBACK_MAIN = `${W}/2026/05/file_00000000ab6c7208899e7d70e3e33471.png`;

export default async function HomePage() {
  const [featured, banners, categoryCounts, activePopup] = await Promise.all([
    getFeaturedProducts(8).catch(() => []),
    db.banner.findMany({ where: { active: true }, orderBy: { position: "asc" } }).catch(() => []),
    db.product.groupBy({ by: ["type"], _count: { id: true } }).catch(() => []),
    db.popup.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }).catch(() => null),
  ]);

  const countMap = Object.fromEntries(categoryCounts.map(r => [r.type, r._count.id]));

  // banners[0] = main hero, banners[1..3] = sub-banners
  // Strip internal placeholder titles so they don't render as content
  const PLACEHOLDER = /^(Hero (Left|Right)|Sub-banner [1-3])$/i;
  function displayTitle(b: typeof banners[0] | undefined) {
    return b?.title && !PLACEHOLDER.test(b.title) ? b.title : null;
  }

  const mainBanner   = banners[0] ?? null;
  const subBanners   = banners.slice(1, 4);

  return (
    <>
      {/* ── Brand header ─────────────────────────── */}
      <section
        id="brand-header"
        className="bg-canvas flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "10vh" }}
      >
        <svg viewBox="0 0 100 100" className="w-6 h-6 mb-2 text-accent-amber" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="25" y="25" width="50" height="50" />
          <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
          <circle cx="50" cy="50" r="8" />
        </svg>
        <h1
          className="text-ink font-normal mb-1"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4.5vw, 44px)", letterSpacing: "0.28em", lineHeight: 1.1 }}
        >
          SHIA BAZAAR
        </h1>
        <p className="text-accent-amber font-medium mb-2" style={{ fontSize: "9px", letterSpacing: "0.32em" }}>
          TANZEEMUL MAKATIB
        </p>
        <div className="flex items-center gap-2.5">
          <div className="h-px w-8 bg-accent-amber/60" />
          <div className="w-1 h-1 rounded-full bg-accent-amber" />
          <div className="h-px w-8 bg-accent-amber/60" />
        </div>
      </section>

      {/* ── Sticky navbar (homepage only) ───────── */}
      <HomepageNavbar />

      {/* ── Hero — main banner + sub-banners ────── */}
      <section className="bg-surface-soft">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 lg:gap-4">

            {/* Main banner */}
            <div className="relative overflow-hidden rounded-xl" style={{ height: "clamp(360px, 52vw, 640px)" }}>
              <Image
                src={mainBanner?.imageUrl ?? FALLBACK_MAIN}
                alt="Shia Bazaar"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, calc(100vw - 340px)"
              />
              {(displayTitle(mainBanner) || mainBanner?.subtitle || mainBanner?.ctaLabel) && (
                <div className="absolute inset-0 flex items-stretch">
                  <div className="w-full sm:w-[44%] flex flex-col justify-center px-8 lg:px-12 py-10"
                    style={{ background: "rgba(250,249,245,0.88)", backdropFilter: "blur(2px)" }}>
                    {displayTitle(mainBanner) && (
                      <h2 className="text-ink font-normal leading-[1.1] mb-3"
                        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3.5vw, 48px)", letterSpacing: "-0.5px" }}>
                        {displayTitle(mainBanner)}
                      </h2>
                    )}
                    {mainBanner?.subtitle && (
                      <p className="text-body text-sm leading-relaxed mb-7 max-w-[260px]">{mainBanner.subtitle}</p>
                    )}
                    <Link
                      href={mainBanner?.ctaUrl || "/products"}
                      className="self-start inline-flex items-center h-11 px-7 bg-ink text-canvas text-[11px] font-medium tracking-[0.18em] uppercase rounded-sm hover:bg-ink/80 transition-colors"
                    >
                      {mainBanner?.ctaLabel || "Explore Collection"}
                    </Link>
                  </div>
                  <div className="flex-1" />
                </div>
              )}
            </div>

            {/* Sub-banners: 3-col row on mobile, flex column on desktop */}
            <div className="grid grid-cols-3 gap-3 lg:flex lg:flex-col lg:gap-4">
              {[0, 1, 2].map(i => {
                const b = subBanners[i];
                const href = b?.ctaUrl || "/products";
                const img  = b?.imageUrl ?? null;
                const title = displayTitle(b);
                const hasText = !!(title || b?.subtitle);
                return (
                  <Link key={i} href={href}
                    className="group relative overflow-hidden rounded-xl bg-surface-dark [aspect-ratio:4/3] lg:[aspect-ratio:auto] lg:flex-1"
                  >
                    {img && (
                      <Image src={img} alt={title ?? "Banner"} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1024px) 33vw, 320px" />
                    )}
                    {hasText && <div className="absolute inset-0 bg-black/45" />}
                    {hasText && (
                      <div className="absolute inset-0 flex flex-col justify-center px-4 py-4 lg:px-5 lg:py-5">
                        {title && (
                          <p className="text-white font-normal uppercase leading-tight"
                            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(14px, 1.4vw, 20px)", letterSpacing: "0.06em" }}>
                            {title}
                          </p>
                        )}
                        {title && b?.subtitle && (
                          <div className="flex items-center gap-2 my-2">
                            <div className="h-px w-6 bg-accent-amber/65" />
                            <svg width="6" height="6" viewBox="0 0 8 8" fill="none" className="text-accent-amber shrink-0">
                              <rect x="4" y="0.5" width="5" height="5" transform="rotate(45 4 0.5)" stroke="currentColor" strokeWidth="0.8" />
                            </svg>
                            <div className="h-px w-6 bg-accent-amber/65" />
                          </div>
                        )}
                        {b?.subtitle && (
                          <p className="text-white/80 text-[10px] leading-relaxed max-w-[180px]">{b.subtitle}</p>
                        )}
                        {b?.ctaLabel && (
                          <span className="inline-flex items-center mt-3 h-7 px-3 text-[9px] font-medium tracking-[0.16em] uppercase rounded-sm w-fit text-white border border-accent-amber/70">
                            {b.ctaLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
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
