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
  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative flex flex-col bg-surface-card rounded-xl overflow-hidden border border-hairline hover:shadow-sm transition-shadow",
        className
      )}
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] bg-surface-soft overflow-hidden">
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
        {/* Wishlist toggle */}
        <button
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-canvas/80 backdrop-blur-sm flex items-center justify-center text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={15} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        <p className="text-xs text-muted uppercase tracking-wide font-medium">
          {product.author ?? product.type}
        </p>
        <h3 className="text-sm font-medium text-ink leading-snug line-clamp-2">
          {product.title}
        </h3>
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-ink">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through">₹{product.originalPrice}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted">
            <span className="text-accent-amber">★</span>
            <span>{product.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
