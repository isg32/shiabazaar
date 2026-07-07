import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Gift, Sparkles, Crown } from "lucide-react";
import type { ElementType } from "react";
import { FadeIn } from "@/components/shared/FadeIn";
import {
  getFeaturedProducts,
  getPopularBooks,
  getBanners,
  getCategoryCounts,
  getActivePopup,
} from "@/lib/queries";
import { ProductCard } from "@/components/shared/ProductCard";
import { HomepagePopup } from "@/components/shared/HomepagePopup";
import { HomepageNavbar } from "@/components/layout/Navbar";
import { ScrollBookLazy } from "@/components/shared/ScrollBookLazy";
import { SubBannerCarousel } from "@/components/shared/SubBannerCarousel";

const catMeta: Record<
  string,
  {
    Icon: ElementType;
    color: string;
    description: string;
    slug: string;
    label: string;
  }
> = {
  book: {
    slug: "books",
    label: "Islamic Books",
    Icon: BookOpen,
    color: "#cc785c",
    description: "Quran, tafsir, fiqh, history & duas",
  },
  gift: {
    slug: "gifts",
    label: "Gifts",
    Icon: Gift,
    color: "#e8a55a",
    description: "Alam, mashak, mugs, lamps & more",
  },
  ladies: {
    slug: "ladies",
    label: "Ladies",
    Icon: Sparkles,
    color: "#5db8a6",
    description: "Curated picks for women",
  },
  gents: {
    slug: "gents",
    label: "Gents",
    Icon: Crown,
    color: "#8b7fc7",
    description: "Curated picks for men",
  },
};

const trustSignals = [
  { icon: "🚚", title: "Free Shipping", description: "On orders above ₹500" },
  {
    icon: "🔒",
    title: "Secure Payments",
    description: "Razorpay protected checkout",
  },
  {
    icon: "↩️",
    title: "Easy Returns",
    description: "7-day hassle-free returns",
  },
  {
    icon: "📦",
    title: "Careful Packaging",
    description: "Books packed to prevent damage",
  },
];

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

const W = "https://shiabazaar.com/wp-content/uploads";
const FALLBACK_MAIN = `${W}/2026/05/file_00000000ab6c7208899e7d70e3e33471.png`;

export default async function HomePage() {
  const [featured, popularBooks, banners, categoryCounts, activePopup] =
    await Promise.all([
      getFeaturedProducts(8).catch(() => []),
      getPopularBooks(12).catch(() => []),
      getBanners().catch(() => []),
      getCategoryCounts().catch(() => []),
      getActivePopup().catch(() => null),
    ]);

  const countMap = Object.fromEntries(
    categoryCounts.map((r) => [r.type, r._count.id]),
  );

  // banners[0] = main hero, banners[1..3] = sub-banners
  // Strip internal placeholder titles so they don't render as content
  const PLACEHOLDER = /^(Hero (Left|Right)|Sub-banner [1-3])$/i;
  function displayTitle(b: (typeof banners)[0] | undefined) {
    return b?.title && !PLACEHOLDER.test(b.title) ? b.title : null;
  }

  const mainBanner = banners[0] ?? null;
  const subBanners = banners.slice(1, 4);

  return (
    <>
      {/* ── Brand header ─────────────────────────── */}
      <section
        id="brand-header"
        className="hidden lg:flex bg-canvas flex-col items-center justify-center text-center px-8"
        style={{ minHeight: "10vh" }}
      >
        <Image
          src="/logo-main.png"
          alt="Shia Bazaar"
          width={300}
          height={104}
          className="mb-2"
          priority
        />
      </section>

      {/* ── Sticky navbar (homepage only) ───────── */}
      <HomepageNavbar />

      {/* ── Hero — main banner + sub-banners ────── */}
      <section className="bg-surface-soft">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 lg:gap-4">
            {/* Main banner */}
            <div
              className="relative overflow-hidden rounded-xl"
              style={{ height: "clamp(300px, 46vw, 580px)" }}
            >
              <Image
                src={mainBanner?.imageUrl ?? FALLBACK_MAIN}
                alt="Shia Bazaar"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, calc(100vw - 340px)"
              />
              {/* Mobile: top gradient so top-left text is readable */}
              <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/65 via-black/25 to-transparent sm:hidden" />

              {(displayTitle(mainBanner) ||
                mainBanner?.subtitle ||
                mainBanner?.ctaLabel) && (
                <div className="absolute inset-0 flex items-stretch">
                  {/* Mobile layout: title top-left, button bottom-left */}
                  <div className="flex sm:hidden flex-col justify-between px-5 pt-6 pb-6 w-full h-full">
                    <div>
                      {displayTitle(mainBanner) && (
                        <h2
                          className="text-white font-normal leading-[1.1] mb-2"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(30px, 9vw, 42px)",
                            letterSpacing: "-0.5px",
                          }}
                        >
                          {displayTitle(mainBanner)}
                        </h2>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className="h-px w-8 bg-accent-amber" />
                        <svg
                          width="5"
                          height="5"
                          viewBox="0 0 8 8"
                          fill="none"
                          className="text-accent-amber shrink-0"
                        >
                          <rect
                            x="4"
                            y="0.5"
                            width="5"
                            height="5"
                            transform="rotate(45 4 0.5)"
                            stroke="currentColor"
                            strokeWidth="1"
                          />
                        </svg>
                      </div>
                    </div>
                    <Link
                      href={mainBanner?.ctaUrl || "/products"}
                      className="self-start inline-flex items-center h-9 px-5 bg-white/90 text-ink text-[10px] font-medium tracking-[0.18em] uppercase rounded-sm hover:bg-white transition-colors"
                    >
                      {mainBanner?.ctaLabel || "Explore Collection"}
                    </Link>
                  </div>

                  {/* Desktop layout: left-side panel */}
                  <div className="hidden sm:flex w-[44%] flex-col justify-center px-8 lg:px-12 py-10">
                    {displayTitle(mainBanner) && (
                      <h2
                        className="text-black font-normal leading-[1.1] mb-3"
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "clamp(24px, 3.5vw, 48px)",
                          letterSpacing: "-0.5px",
                        }}
                      >
                        {displayTitle(mainBanner)}
                      </h2>
                    )}
                    {mainBanner?.subtitle && (
                      <p className="text-black/90 text-sm leading-relaxed mb-7 max-w-[260px]">
                        {mainBanner.subtitle}
                      </p>
                    )}
                    <Link
                      href={mainBanner?.ctaUrl || "/products"}
                      className="self-start inline-flex items-center h-11 px-7 bg-ink text-canvas text-[11px] font-medium tracking-[0.18em] uppercase rounded-sm hover:bg-ink/80 transition-colors"
                    >
                      {mainBanner?.ctaLabel || "Explore Collection"}
                    </Link>
                  </div>
                  <div className="hidden sm:flex flex-1" />
                </div>
              )}
            </div>

            {/* Sub-banners — client component for infinite scroll + active dots */}
            <SubBannerCarousel banners={subBanners} />

          </div>
        </div>
      </section>

      {/* ── Marquee strip ────────────────────────── */}
      <div className="bg-surface-soft overflow-hidden py-3 border-y border-hairline">
        <div className="marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 px-4 text-sm font-medium text-body"
            >
              <span className="text-primary text-base leading-none">✦</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="geometric-divider" />

      {/* ── Category tile grid ───────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <FadeIn className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
          <h2 className="display-sm text-ink">Browse by Category</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap"
          >
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
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${meta.color}1a` }}
                >
                  <meta.Icon size={32} style={{ color: meta.color }} />
                </div>
                <p className="text-sm font-medium text-ink">{meta.label}</p>
                <p className="text-xs text-body mt-1 leading-snug">
                  {meta.description}
                </p>
                <p className="text-xs text-primary mt-3 font-medium">
                  {countMap[type] ?? 0} items
                </p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      <div className="geometric-divider" />

      {/* ── Popular Books ────────────────────────── */}
      {popularBooks.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-section">
          <FadeIn className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[1.5px] text-primary mb-2">
                Curated Selection
              </p>
              <h2 className="display-sm text-ink">Popular Books</h2>
            </div>
            <Link
              href="/products?type=book"
              className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap"
            >
              All books <ArrowRight size={14} />
            </Link>
          </FadeIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularBooks.map((product, i) => (
              <FadeIn key={product.id} delay={i * 60}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      <div className="geometric-divider" />

      {/* ── Featured products ────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-section">
        <FadeIn className="flex items-end justify-between mb-8">
          <h2 className="display-sm text-ink">Featured Products</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-primary hover:text-primary-active flex items-center gap-1 whitespace-nowrap"
          >
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
              <div
                className="min-h-[280px] lg:min-h-0 overflow-hidden"
                style={{ background: "rgba(169,88,62,0.2)" }}
              >
                <ScrollBookLazy />
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
            <FadeIn
              key={signal.title}
              delay={i * 80}
              className="bg-surface-card rounded-xl p-6 flex flex-col gap-3 min-w-0"
            >
              <span className="text-2xl">{signal.icon}</span>
              <p className="text-sm font-medium text-ink">{signal.title}</p>
              <p className="text-xs text-body leading-snug">
                {signal.description}
              </p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Popup ────────────────────────────────── */}
      {activePopup && <HomepagePopup popup={activePopup} />}
    </>
  );
}
