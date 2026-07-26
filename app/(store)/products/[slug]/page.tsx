import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";
import { db } from "@/lib/db";
import { Badge } from "@/components/shared/Badge";
import { ProductCard } from "@/components/shared/ProductCard";
import { ProductGallery } from "@/components/shared/ProductGallery";
import { ProductActions } from "@/components/shared/ProductActions";
import { ProductAccordion } from "@/components/shared/ProductAccordion";
import { ReviewForm } from "@/components/shared/ReviewForm";
import { WishlistButton } from "@/components/shared/WishlistButton";
import { MembershipBar } from "@/components/shared/MembershipBar";
import { PincodeChecker } from "@/components/shared/PincodeChecker";
import type { Metadata } from "next";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return { title: product.title, description: product.description };
}

function reviewerName(user: { name: string | null; email: string }) {
  if (user.name) {
    const parts = user.name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
  }
  return user.email.split("@")[0];
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const allImages = [product.coverImage, ...(product.images ?? [])];
  const [related, reviews] = await Promise.all([
    getRelatedProducts(product.id, product.type, 4),
    db.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

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

            {/* Summary */}
            {product.description && (
              <p className="text-sm text-body leading-relaxed">
                {product.description.length > 180
                  ? product.description.slice(0, 177) + "…"
                  : product.description}
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

            {/* Price, stock, variant selector, quantity, add to cart */}
            <ProductActions
              baseInStock={product.inStock}
              product={{ id: product.id, title: product.title, price: product.price, originalPrice: product.originalPrice, coverImage: product.coverImage, author: product.author, type: product.type }}
              variants={product.variants}
            />

            <WishlistButton productId={product.id} />

            <PincodeChecker />
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
          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {reviews.map((review) => (
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
                  {review.body && <p className="text-sm text-body leading-relaxed">{review.body}</p>}
                  <div className="flex justify-between items-center text-xs text-body mt-auto pt-2 border-t border-hairline-soft">
                    <span className="font-medium text-ink">{reviewerName(review.user)}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted mb-2">No reviews yet. Be the first to review this product.</p>
          )}
          <ReviewForm productId={product.id} />
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
