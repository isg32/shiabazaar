"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export type SubBanner = {
  imageUrl?: string | null;
  ctaUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaLabel?: string | null;
};

const PLACEHOLDER = /^(Hero (Left|Right)|Sub-banner [1-3])$/i;
function getTitle(b: SubBanner | undefined) {
  return b?.title && !PLACEHOLDER.test(b.title) ? b.title : null;
}

function Card({ b, className }: { b: SubBanner; className: string }) {
  const title = getTitle(b);
  return (
    <Link
      href={b?.ctaUrl || "/products"}
      className={`group relative overflow-hidden bg-surface-dark ${className}`}
    >
      {b?.imageUrl && (
        <Image
          src={b.imageUrl}
          alt={title ?? "Banner"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 1024px) 80vw, 320px"
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 flex flex-col items-start justify-center px-4 py-4 lg:px-5 lg:py-5">
        {title && (
          <p
            className="text-white font-normal uppercase leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(15px, 1.4vw, 20px)",
              letterSpacing: "0.06em",
            }}
          >
            {title}
          </p>
        )}
        {title && (
          <div className="flex items-center gap-2 my-2">
            <div className="h-px w-6 bg-accent-amber/95" />
            <svg
              width="6"
              height="6"
              viewBox="0 0 8 8"
              fill="none"
              className="text-accent-amber/95 shrink-0"
            >
              <rect
                x="4"
                y="0.5"
                width="5"
                height="5"
                transform="rotate(45 4 0.5)"
                stroke="currentColor"
                strokeWidth="0.8"
              />
            </svg>
            <div className="h-px w-6 bg-accent-amber/95" />
          </div>
        )}
        {b?.subtitle && (
          <p className="text-white/80 text-[10px] leading-relaxed max-w-[180px]">
            {b.subtitle}
          </p>
        )}
        {b?.ctaLabel && (
          <span className="inline-flex items-center mt-3 h-7 px-3 text-[9px] font-medium tracking-[0.16em] uppercase rounded-sm w-fit text-white border border-accent-amber">
            {b.ctaLabel}
          </span>
        )}
      </div>
    </Link>
  );
}

export function SubBannerCarousel({ banners }: { banners: SubBanner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = banners.length;
  // Triple for mobile infinite loop; desktop renders originals only
  const mobileItems = [...banners, ...banners, ...banners];

  useEffect(() => {
    const el = ref.current;
    if (!el || n === 0) return;
    const cardW = el.scrollWidth / mobileItems.length;
    el.scrollLeft = cardW * n; // start at middle set
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el || n === 0) return;
    const cardW = el.scrollWidth / mobileItems.length;
    const idx = Math.round(el.scrollLeft / cardW);
    setActive(idx % n);

    if (idx < Math.floor(n * 0.5)) {
      el.style.scrollSnapType = "none";
      el.scrollLeft += cardW * n;
      requestAnimationFrame(() => {
        el.style.scrollSnapType = "";
      });
    } else if (idx >= Math.ceil(n * 2.5)) {
      el.style.scrollSnapType = "none";
      el.scrollLeft -= cardW * n;
      requestAnimationFrame(() => {
        el.style.scrollSnapType = "";
      });
    }
  }, [n, mobileItems.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div className="flex flex-col">
      {/* Desktop: 3 cards stacked in right column */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:gap-4">
        {banners.map((b, i) => (
          <Card key={i} b={b} className="flex-1 h-auto" />
        ))}
      </div>

      {/* Mobile: tripled for infinite horizontal scroll */}
      <div
        ref={ref}
        className="lg:hidden -mx-4 sm:-mx-6 pl-4 sm:pl-6 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden "
      >
        {mobileItems.map((b, i) => (
          <Card key={i} b={b} className="shrink-0 w-[80vw] h-48 snap-start" />
        ))}
      </div>

      {/* Active dots — mobile only */}
      <div className="flex items-center gap-1.5 mt-2 lg:hidden">
        {banners.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === active ? "w-5 bg-muted-soft" : "w-1.5 bg-muted-soft/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
