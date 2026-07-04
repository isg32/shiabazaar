"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Check } from "lucide-react";
import { Badge } from "./Badge";
import type { ProductUI as Product } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn("group flex flex-col", className)}
    >
      {/* Image — fills card, no radius, zooms out on hover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-soft">
        <Image
          src={product.coverImage}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-95"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge label={product.badge} />
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-canvas/70 flex items-center justify-center z-10">
            <Badge label="OUT OF STOCK" />
          </div>
        )}

        {/* Add to Cart — slides up from bottom on hover */}
        <div className="absolute bottom-0 left-0 right-0 z-20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center gap-2 py-4 text-[13px] font-medium tracking-wide transition-colors duration-200 ${
              added
                ? "bg-success text-white"
                : "bg-surface-dark text-on-dark hover:bg-primary"
            }`}
          >
            {added ? <Check size={14} strokeWidth={2} /> : <ShoppingCart size={14} strokeWidth={2} />}
            {added ? "Added!" : "Add to Cart"}
          </button>
        </div>
      </div>

      {/* Info below image */}
      <div className="pt-3 pb-1 flex flex-col gap-2 min-w-0">
        <h3 className="text-[14.5px] font-medium text-ink leading-[1.4] line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-ink">₹{product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted line-through">₹{product.originalPrice}</span>
            )}
          </div>
          {product.rating > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-muted shrink-0">
              <span className="text-accent-amber text-[13px]">★</span>
              {product.rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
