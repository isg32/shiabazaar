"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";

type WishlistItem = {
  id: string;
  productId: string;
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    inStock: boolean;
    author: string | null;
    images: { url: string }[];
  };
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/wishlist")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); });
  }, []);

  async function removeItem(productId: string) {
    setRemoving(productId);
    await fetch("/api/account/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setItems(prev => prev.filter(i => i.productId !== productId));
    setRemoving(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="display-sm text-ink">Wishlist</h1>
        {!loading && <p className="text-sm text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-sm">Your wishlist is empty.</p>
          <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:text-primary-active font-medium">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map(({ id, productId, product: p }) => (
            <div key={id} className="bg-surface-card rounded-xl border border-hairline overflow-hidden group">
              <Link href={`/products/${p.slug}`} className="block aspect-[3/4] bg-surface-soft relative overflow-hidden">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs">No image</div>
                )}
              </Link>
              <div className="p-3">
                <Link href={`/products/${p.slug}`}>
                  <p className="text-sm font-medium text-ink leading-snug line-clamp-2 hover:text-primary transition-colors">{p.title}</p>
                </Link>
                {p.author && <p className="text-xs text-muted mt-0.5">{p.author}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-semibold text-ink">₹{(p.price / 100).toFixed(0)}</p>
                  <button
                    onClick={() => removeItem(productId)}
                    disabled={removing === productId}
                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-error transition-colors disabled:opacity-40"
                    aria-label="Remove from wishlist"
                  >
                    {removing === productId
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                  </button>
                </div>
                {!p.inStock && <p className="text-[10px] font-medium text-error mt-1">Out of stock</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
