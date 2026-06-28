"use client";

import { useState } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";

export function ProductActions({ disabled }: { disabled?: boolean }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (disabled || added) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 pt-1">

      {/* Quantity stepper */}
      <div className="flex items-center self-start">
        <button
          onClick={() => setQty(q => Math.max(1, q - 1))}
          disabled={disabled || qty <= 1}
          className="w-10 h-10 flex items-center justify-center border border-hairline rounded-l-md text-ink hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus size={13} />
        </button>
        <span className="w-12 h-10 flex items-center justify-center border-y border-hairline text-sm font-medium text-ink select-none">
          {qty}
        </span>
        <button
          onClick={() => setQty(q => Math.min(10, q + 1))}
          disabled={disabled || qty >= 10}
          className="w-10 h-10 flex items-center justify-center border border-hairline rounded-r-md text-ink hover:bg-surface-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Add to Cart — outlined coral */}
      <button
        onClick={handleAdd}
        disabled={disabled}
        className={`w-full h-11 inline-flex items-center justify-center gap-2 text-sm font-medium rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          added
            ? "bg-success border-success text-white"
            : "bg-canvas border-primary text-primary hover:bg-primary/8"
        }`}
      >
        {added ? <Check size={16} /> : <ShoppingCart size={16} />}
        {added ? "Added to Cart" : "Add to Cart"}
      </button>

      {/* Buy Now — coral primary */}
      <button
        disabled={disabled}
        className="w-full h-11 inline-flex items-center justify-center text-sm font-medium rounded bg-primary text-on-primary hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Buy Now
      </button>

    </div>
  );
}
