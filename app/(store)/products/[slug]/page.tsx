import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, Scale, TrendingDown } from "lucide-react";
import { featuredProducts } from "@/data/mock";
import { Badge } from "@/components/shared/Badge";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { AddToCartButton } from "@/components/shared/AddToCartButton";
import { ProductAccordion } from "@/components/shared/ProductAccordion";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { MembershipBar } from "@/components/shared/MembershipBar";
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
  { id: 1, author: "Ahmed K.",   rating: 5, date: "12 Jun 2025", body: "Excellent quality, arrived well packaged. Highly recommend." },
  { id: 2, author: "Fatima R.",  rating: 5, date: "4 Jun 2025",  body: "Beautiful book, the translation is clear and the paper quality is great." },
  { id: 3, author: "Hussain M.", rating: 4, date: "28 May 2025", body: "Good product, delivery was a day late but packaging was perfect." },
];

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = featuredProducts.find((p) => p.slug === slug);
  if (!product) notFound();

  const allImages = [product.coverImage, ...(product.images ?? [])];
  const related = featuredProducts.filter(
    (p) => p.id !== product.id && p.type === product.type
  ).slice(0, 4);

  /* ── Accordion content ── */
  const descriptionContent = product.description
    ? <p>{product.description}</p>
    : <p className="text-muted">No description available yet. Check back soon.</p>;

  const additionalInfoContent = product.type === "book" ? (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      {([
        ["Genre",     product.genre],
        ["Publisher", product.publisher ?? "—"],
        ["Pages",     product.pageCount],
        ["Edition",   product.edition ?? "1st"],
        ["Language",  product.language],
        ["ISBN",      product.isbn ?? "—"],
      ] as [string, string | number | undefined][]).filter(([, v]) => v).map(([label, value]) => (
        <div key={label}>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
          <p className="text-sm text-ink font-medium">{value}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-muted">Additional information will be added by the admin.</p>
  );

  return (
    <>
      <div className="max-w-[1200px] mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted mb-8">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
          <span>/</span>
          <span className="text-ink font-medium line-clamp-1">{product.title}</span>
        </nav>

        {/* ── Product main ─────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-10 mb-16">

          {/* Gallery */}
          <ProductGallery images={allImages} title={product.title} />

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product.type === "book" && product.language && (
              <Badge label={product.language} variant="neutral" />
            )}

            <h1 className="display-md text-ink">{product.title}</h1>

            {product.author && (
              <p className="text-sm text-body">
                by <span className="text-ink font-medium">{product.author}</span>
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={
                      s <= Math.round(product.rating)
                        ? "fill-accent-amber text-accent-amber"
                        : "fill-hairline text-hairline"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-body">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-ink">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-body line-through text-base">₹{product.originalPrice}</span>
                  <Badge label="SALE" />
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${product.inStock ? "bg-success" : "bg-error"}`} />
              <span className="text-sm text-body">{product.inStock ? "In Stock" : "Out of Stock"}</span>
            </div>

            {/* Add to Cart + Buy Now */}
            <div className="flex flex-col gap-2 pt-1">
              <AddToCartButton disabled={!product.inStock} />
              <button
                disabled={!product.inStock}
                className="w-full h-11 px-6 text-sm font-medium bg-canvas border border-hairline text-ink rounded hover:bg-surface-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* ── Pincode — Coming Soon ── */}
            <div className="pt-3 border-t border-hairline">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={13} className="text-muted" />
                <span className="text-xs font-medium text-muted">Check delivery to your area</span>
                <span className="text-[9px] font-medium uppercase tracking-[0.8px] bg-surface-cream-strong text-muted px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  disabled
                  placeholder="Enter pincode…"
                  className="h-9 flex-1 min-w-0 px-3 text-sm border border-hairline rounded-md bg-surface-soft text-muted placeholder:text-muted-soft cursor-not-allowed"
                />
                <button
                  disabled
                  className="h-9 px-4 text-sm font-medium bg-primary-disabled text-muted-soft rounded-md cursor-not-allowed shrink-0"
                >
                  Check
                </button>
              </div>
            </div>

            {/* ── Coming-soon actions ── */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <button className="flex items-center gap-1.5 text-xs text-muted opacity-50 cursor-not-allowed select-none">
                <Scale size={13} />
                Add to Compare
                <span className="bg-hairline text-muted text-[9px] uppercase tracking-[0.6px] px-1.5 py-0.5 rounded-full ml-0.5">
                  Soon
                </span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted opacity-50 cursor-not-allowed select-none">
                <TrendingDown size={13} />
                Track Price
                <span className="bg-hairline text-muted text-[9px] uppercase tracking-[0.6px] px-1.5 py-0.5 rounded-full ml-0.5">
                  Soon
                </span>
              </button>
            </div>

            {/* ── Share ── */}
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="font-medium">Share on:</span>
              {/* WhatsApp */}
              <span className="opacity-40 cursor-not-allowed" aria-label="Share on WhatsApp">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </span>
              {/* X / Twitter */}
              <span className="opacity-40 cursor-not-allowed" aria-label="Share on X">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
              </span>
              {/* Facebook */}
              <span className="opacity-40 cursor-not-allowed" aria-label="Share on Facebook">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* ── Description & Additional Info accordion ── */}
        <div className="mb-16">
          <ProductAccordion
            items={[
              { title: "Description",           content: descriptionContent },
              { title: "Additional Information", content: additionalInfoContent },
            ]}
          />
        </div>

        {/* ── Reviews ──────────────────────────────────── */}
        <section className="mb-16">
          <h2 className="display-sm text-ink mb-8">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockReviews.map((review) => (
              <div key={review.id} className="bg-surface-card p-6 flex flex-col gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      size={13}
                      className={
                        s <= review.rating
                          ? "fill-accent-amber text-accent-amber"
                          : "fill-hairline text-hairline"
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-body leading-relaxed">{review.body}</p>
                <div className="flex justify-between items-center text-xs text-body mt-auto pt-2 border-t border-hairline-soft">
                  <span className="font-medium text-ink">{review.author}</span>
                  <span>{review.date}</span>
                </div>
              </div>
            ))}
          </div>
          <ReviewForm />
        </section>

        <div className="geometric-divider mb-16" />

        {/* ── Related ──────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mb-16">
            <h2 className="display-sm text-ink mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-10">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* ── Membership bar — full bleed ── */}
      <MembershipBar />
    </>
  );
}
