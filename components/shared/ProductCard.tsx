"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Badge } from "./Badge";
import type { Product } from "@/data/mock";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const pubText = product.author ?? null;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("group flex flex-col", className)}
    >
      {/* Image — full card */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-soft">
        <Image
          src={product.coverImage}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {product.badge && (
          <div className="absolute top-3 left-3">
            <Badge label={product.badge} />
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-canvas/70 flex items-center justify-center">
            <Badge label="OUT OF STOCK" />
          </div>
        )}

        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-canvas/80 backdrop-blur-sm flex items-center justify-center text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={15} />
        </button>

        {/* Publication / author — bottom-left, fades right */}
        {pubText && (
          <>
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 pb-2.5 px-3 flex items-center gap-1.5 pointer-events-none">
              <span className="text-primary text-sm font-bold shrink-0 leading-none">|</span>
              <span
                className="text-white/90 text-xs font-medium leading-none whitespace-nowrap overflow-hidden block"
                style={{
                  WebkitMaskImage: "linear-gradient(to right, black 45%, transparent 92%)",
                  maskImage: "linear-gradient(to right, black 45%, transparent 92%)",
                }}
              >
                {pubText}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Info below image */}
      <div className="pt-2.5 px-0.5 flex flex-col gap-1 min-w-0">
        <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-ink">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through">₹{product.originalPrice}</span>
            )}
          </div>
          {product.rating > 0 && (
            <span className="text-xs text-muted flex items-center gap-0.5 shrink-0">
              <span className="text-accent-amber">★</span>
              {product.rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
