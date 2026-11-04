"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export function AddToCartButton({ disabled }: { disabled?: boolean }) {
  const [added, setAdded] = useState(false);

  function handleClick() {
    if (disabled || added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        added
          ? "bg-success text-white"
          : "bg-primary text-on-primary hover:bg-primary-active"
      }`}
    >
      {added ? <Check size={16} /> : <ShoppingCart size={16} />}
      {added ? "Added to Cart" : "Add to Cart"}
    </button>
  );
}
