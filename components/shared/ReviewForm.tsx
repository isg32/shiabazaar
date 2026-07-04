"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function ReviewForm({ productId }: { productId?: string }) {
  const session = authClient.useSession();
  const router = useRouter();
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body,    setBody]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  async function submit() {
    if (!session.data?.user) { router.push("/auth/sign-in"); return; }
    if (!productId) return;
    if (rating === 0) { setError("Please select a rating"); return; }

    setLoading(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, body }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Failed to submit review"); }
    else { setDone(true); }
    setLoading(false);
  }

  if (!productId) return null;

  if (done) {
    return (
      <div className="bg-surface-card border border-hairline rounded-xl p-6 mt-8 text-center">
        <p className="text-sm font-medium text-success mb-1">Review submitted!</p>
        <p className="text-xs text-muted">Thank you for your feedback.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-hairline rounded-xl p-6 mt-8">
      <h3 className="font-medium text-ink mb-5">Write a Review</h3>

      {!session.data?.user && (
        <p className="text-xs text-muted mb-4">
          You must{" "}
          <button onClick={() => router.push("/auth/sign-in")} className="text-primary underline">sign in</button>
          {" "}and have purchased this product to leave a review.
        </p>
      )}

      <div className="mb-4">
        <p className="text-xs text-muted uppercase tracking-wide mb-2">Your rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(s)}
            >
              <Star
                size={24}
                className={
                  s <= (hovered || rating)
                    ? "fill-accent-amber text-accent-amber transition-colors"
                    : "fill-hairline text-hairline transition-colors"
                }
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <textarea
          rows={4}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Share your experience with this product…"
          className="w-full px-3 py-2.5 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors resize-none"
        />
      </div>

      {error && <p className="text-xs text-error mb-3">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
