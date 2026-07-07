"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Badge } from "./Badge";

interface Variant { id: string; label: string; stock: number; price?: number }

interface Props {
  baseInStock?: boolean;
  product: {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    coverImage: string;
    author?: string | null;
    type: string;
  };
  variants?: Variant[];
}

export function ProductActions({ baseInStock = true, product, variants }: Props) {
  const { addItem } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants && variants.length > 0 ? variants[0] : null
  );

  const effectivePrice = selectedVariant?.price ?? product.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : baseInStock;

  async function handleAdd() {
    if (!inStock || added) return;
    await addItem({
      productId:  product.id,
      variantId:  selectedVariant?.id ?? null,
      title:      product.title,
      price:      effectivePrice,
      coverImage: product.coverImage,
      author:     product.author ?? null,
      type:       product.type,
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  async function handleBuyNow() {
    if (!inStock) return;
    await addItem({
      productId:  product.id,
      variantId:  selectedVariant?.id ?? null,
      title:      product.title,
      price:      effectivePrice,
      coverImage: product.coverImage,
      author:     product.author ?? null,
      type:       product.type,
      qty,
    });
    router.push("/cart");
  }

  return (
    <div className="flex flex-col gap-4 pt-1">

      {/* Price — reactive to selected variant */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-ink">₹{effectivePrice}</span>
        {product.originalPrice && effectivePrice < product.originalPrice && (
          <>
            <span className="text-body line-through text-base">₹{product.originalPrice}</span>
            <Badge label="SALE" />
          </>
        )}
      </div>

      {/* Stock indicator — reactive to selected variant */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${inStock ? "bg-success" : "bg-error"}`} />
        <span className="text-sm text-body">{inStock ? "In Stock" : "Out of Stock"}</span>
      </div>

      {/* Variant chips */}
      {variants && variants.length > 0 && (
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-2">
            Size / Variant
            {selectedVariant && (
              <span className="ml-2 normal-case tracking-normal text-ink font-medium">— {selectedVariant.label}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`h-9 px-4 text-sm rounded-md border transition-colors ${
                  selectedVariant?.id === v.id
                    ? "border-primary bg-primary/8 text-primary font-medium"
                    : v.stock <= 0
                      ? "border-hairline text-muted-soft line-through cursor-not-allowed"
                      : "border-hairline text-body hover:border-primary/60 hover:text-ink"
                }`}
                disabled={v.stock <= 0}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="flex items-center self-start">
        <button
          onClick={() => setQty(q => Math.max(1, q - 1))}
          disabled={!inStock || qty <= 1}
          className="w-10 h-10 flex items-center justify-center border border-hairline rounded-l-md text-ink hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={13} />
        </button>
        <span className="w-12 h-10 flex items-center justify-center border-y border-hairline text-sm font-medium text-ink select-none">
          {qty}
        </span>
        <button
          onClick={() => setQty(q => Math.min(10, q + 1))}
          disabled={!inStock || qty >= 10}
          className="w-10 h-10 flex items-center justify-center border border-hairline rounded-r-md text-ink hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      <button
        onClick={handleAdd}
        disabled={!inStock}
        className={`w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          added
            ? "bg-success border-success text-white"
            : "bg-canvas border-primary text-primary hover:bg-primary/8"
        }`}
      >
        {added ? <Check size={16} /> : <ShoppingCart size={16} />}
        {added ? "Added to Cart" : "Add to Cart"}
      </button>

      <button
        onClick={handleBuyNow}
        disabled={!inStock}
        className="w-full h-11 inline-flex items-center justify-center text-sm font-medium rounded bg-primary text-on-primary hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Buy Now
      </button>

    </div>
  );
}
