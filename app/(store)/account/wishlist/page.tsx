import { featuredProducts } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Wishlist" };

const wishlistItems = featuredProducts.slice(0, 5);

export default function WishlistPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="display-sm text-ink">Wishlist</h1>
        <p className="text-sm text-muted">{wishlistItems.length} items</p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {wishlistItems.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted">
          <p>Your wishlist is empty.</p>
        </div>
      )}
    </div>
  );
}
