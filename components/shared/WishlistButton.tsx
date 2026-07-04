"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function WishlistButton({ productId }: { productId: string }) {
  const session = authClient.useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session.data?.user) { setChecked(true); return; }
    fetch("/api/account/wishlist")
      .then(r => r.json())
      .then(d => {
        setWishlisted((d.items ?? []).some((i: { productId: string }) => i.productId === productId));
        setChecked(true);
      });
  }, [session.data?.user, productId]);

  async function toggle() {
    if (!session.data?.user) {
      router.push("/auth/sign-in");
      return;
    }
    setLoading(true);
    if (wishlisted) {
      await fetch("/api/account/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setWishlisted(false);
    } else {
      await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setWishlisted(true);
    }
    setLoading(false);
  }

  if (!checked) return <div className="h-5" />;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
        wishlisted ? "text-error" : "text-muted hover:text-error"
      }`}
    >
      <Heart size={14} className={wishlisted ? "fill-current" : ""} />
      {wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
    </button>
  );
}
