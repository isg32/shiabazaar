"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Loader2 } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  product: { title: string; slug: string };
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/reviews")
      .then(r => r.json())
      .then(d => { setReviews(d.reviews ?? []); setLoading(false); });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-sm text-ink">My Reviews</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-sm">No reviews yet.</p>
          <p className="text-xs mt-1.5">Reviews are available after completing an order.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-surface-card rounded-xl p-5 border border-hairline">
              <div className="flex items-start justify-between gap-4 mb-3">
                <Link href={`/products/${r.product.slug}`} className="text-sm font-medium text-ink hover:text-primary transition-colors">
                  {r.product.title}
                </Link>
                <span className="text-xs text-muted shrink-0">{fmtDate(r.createdAt)}</span>
              </div>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={13} className={s <= r.rating ? "fill-accent-amber text-accent-amber" : "text-hairline fill-hairline"} />
                ))}
              </div>
              {r.title && <p className="text-sm font-medium text-ink mb-1">{r.title}</p>}
              {r.body  && <p className="text-sm text-body leading-relaxed">{r.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
