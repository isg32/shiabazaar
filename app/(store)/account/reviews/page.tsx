import { Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Reviews" };

const reviews = [
  { id: 1, product: "Nahjul Balagha", rating: 5, date: "12 Jun 2025", body: "Excellent quality, arrived well packaged. Highly recommend to every Muslim household." },
  { id: 2, product: "Ya Hussain Ceramic Mug", rating: 4, date: "4 Jun 2025", body: "Beautiful mug, the calligraphy is very clear. Would have given 5 stars but delivery took longer than expected." },
  { id: 3, product: "Ayatul Kursi Night Lamp", rating: 5, date: "28 May 2025", body: "Perfect gift for the home. The warm light and the Ayatul Kursi engraving is just beautiful." },
];

export default function ReviewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-sm text-ink">My Reviews</h1>

      <div className="flex flex-col gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-surface-card rounded-xl p-5 border border-hairline">
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className="text-sm font-medium text-ink">{r.product}</p>
              <span className="text-xs text-muted shrink-0">{r.date}</span>
            </div>
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} size={13} className={s <= r.rating ? "fill-accent-amber text-accent-amber" : "text-hairline fill-hairline"} />
              ))}
            </div>
            <p className="text-sm text-body leading-relaxed">{r.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
