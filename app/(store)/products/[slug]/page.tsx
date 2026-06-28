import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Star, ChevronRight } from "lucide-react";
import { featuredProducts } from "@/data/mock";
import { Badge } from "@/components/shared/Badge";
import { ProductCard } from "@/components/shared/ProductCard";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = featuredProducts.find((p) => p.slug === slug);
  if (!product) return {};
  return { title: product.title, description: product.description };
}

export async function generateStaticParams() {
  return featuredProducts.map((p) => ({ slug: p.slug }));
}

const mockReviews = [
  { id: 1, author: "Ahmed K.", rating: 5, date: "12 Jun 2025", body: "Excellent quality, arrived well packaged. Highly recommend." },
  { id: 2, author: "Fatima R.", rating: 5, date: "4 Jun 2025", body: "Beautiful book, the translation is clear and the paper quality is great." },
  { id: 3, author: "Hussain M.", rating: 4, date: "28 May 2025", body: "Good product, delivery was a day late but packaging was perfect." },
];

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = featuredProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const related = featuredProducts.filter(
    (p) => p.id !== product.id && p.type === product.type
  ).slice(0, 4);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted mb-8">
        <Link href="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-ink">Products</Link>
        <ChevronRight size={12} />
        <span className="text-ink">{product.title}</span>
      </nav>

      {/* ── Product main ───────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Cover */}
        <div className="relative aspect-[3/4] max-w-sm mx-auto lg:mx-0 w-full rounded-xl overflow-hidden bg-surface-card border border-hairline">
          <Image
            src={product.coverImage}
            alt={product.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {product.badge && (
            <div className="absolute top-4 left-4">
              <Badge label={product.badge} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {product.type === "book" && product.language && (
            <Badge label={product.language} variant="neutral" />
          )}
          <h1 className="display-md text-ink">{product.title}</h1>
          {product.author && (
            <p className="text-muted text-sm">by <span className="text-ink font-medium">{product.author}</span></p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={s <= Math.round(product.rating) ? "fill-accent-amber text-accent-amber" : "text-hairline fill-hairline"}
                />
              ))}
            </div>
            <span className="text-sm text-muted">{product.rating} ({product.reviewCount} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">₹{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-muted line-through text-base">₹{product.originalPrice}</span>
                <Badge label="SALE" />
              </>
            )}
          </div>

          {/* Book metadata */}
          {product.type === "book" && (
            <div className="grid grid-cols-2 gap-3 bg-surface-soft rounded-xl p-4">
              {[
                ["Genre", product.genre],
                ["Publisher", product.publisher ?? "—"],
                ["Pages", product.pageCount],
                ["Edition", product.edition ?? "1st"],
                ["Language", product.language],
                ["ISBN", product.isbn ?? "—"],
              ].map(([label, value]) => value && (
                <div key={label as string}>
                  <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-ink font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}

          {product.description && (
            <p className="text-sm text-body leading-relaxed">{product.description}</p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${product.inStock ? "bg-success" : "bg-error"}`} />
            <span className="text-sm text-muted">{product.inStock ? "In Stock" : "Out of Stock"}</span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              disabled={!product.inStock}
              className="flex-1 inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-canvas border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
              <Heart size={16} /> Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* ── Geometric divider ───────────────────────── */}
      <div className="geometric-divider mb-16" />

      {/* ── Reviews ──────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="display-sm text-ink mb-8">Customer Reviews</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockReviews.map((review) => (
            <div key={review.id} className="bg-surface-card rounded-xl p-6 flex flex-col gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={13} className={s <= review.rating ? "fill-accent-amber text-accent-amber" : "text-hairline fill-hairline"} />
                ))}
              </div>
              <p className="text-sm text-body leading-relaxed">{review.body}</p>
              <div className="flex justify-between items-center text-xs text-muted mt-auto pt-2 border-t border-hairline-soft">
                <span className="font-medium text-ink">{review.author}</span>
                <span>{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Related products ─────────────────────────── */}
      {related.length > 0 && (
        <section>
          <h2 className="display-sm text-ink mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
