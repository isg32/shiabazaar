"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const { items, loading, updateQty, removeItem } = useCart();
  const [coupon, setCoupon]     = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponErr, setCouponErr] = useState("");
  const [applying, setApplying] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 500 ? 0 : 99;
  const total = subtotal - discount + shipping;

  async function applyCoupon() {
    if (!coupon.trim()) return;
    setApplying(true);
    setCouponErr("");
    const res = await fetch(`/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon.trim().toUpperCase(), subtotal }),
    });
    if (res.ok) {
      const d = await res.json();
      setDiscount(d.discount ?? 0);
    } else {
      setCouponErr("Invalid or expired coupon.");
      setDiscount(0);
    }
    setApplying(false);
  }

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 flex items-center justify-center gap-2 text-muted">
        <Loader2 size={18} className="animate-spin" /> Loading cart…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-hairline mb-4" />
        <h1 className="display-sm text-ink mb-3">Your cart is empty</h1>
        <p className="text-body text-sm mb-8">Add some books and gifts to get started.</p>
        <Link href="/products" className="inline-flex items-center gap-2 h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
          Browse Products <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <h1 className="display-md text-ink mb-8">Your Cart</h1>

      <div className="flex flex-col lg:flex-row gap-10">

        {/* Cart items */}
        <div className="flex-1 divide-y divide-hairline">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? "base"}`} className="py-6 flex gap-5">
              <div className="relative w-20 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-surface-card border border-hairline">
                {item.coverImage ? (
                  <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full bg-surface-soft" />
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <p className="text-xs text-muted uppercase tracking-wide">{item.author ?? item.type}</p>
                <h3 className="text-sm font-medium text-ink leading-snug">{item.title}</h3>
                <p className="text-base font-semibold text-ink mt-1">₹{item.price.toFixed(0)}</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center border border-hairline rounded-md overflow-hidden">
                    <button
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card text-base"
                      onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
                    >−</button>
                    <span className="w-8 text-center text-sm font-medium text-ink">{item.qty}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card text-base"
                      onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
                    >+</button>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.variantId)} className="text-muted hover:text-error transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-ink">₹{(item.price * item.qty).toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-surface-card rounded-xl p-6 flex flex-col gap-4 sticky top-20">
            <h2 className="text-base font-medium text-ink">Order Summary</h2>

            {/* Coupon */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={coupon}
                onChange={e => { setCoupon(e.target.value); setCouponErr(""); }}
                className="flex-1 h-9 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary uppercase"
              />
              <button
                onClick={applyCoupon}
                disabled={applying}
                className="h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
              >
                {applying ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
              </button>
            </div>
            {couponErr && <p className="text-xs text-error">{couponErr}</p>}
            {discount > 0 && <p className="text-xs text-success">Coupon applied — ₹{discount} off!</p>}

            <div className="space-y-2 text-sm border-t border-hairline pt-4">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−₹{discount.toFixed(0)}</span></div>}
              <div className="flex justify-between text-body">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-success">Free</span> : `₹${shipping}`}</span>
              </div>
              {shipping > 0 && <p className="text-xs text-muted">Add ₹{(500 - subtotal).toFixed(0)} more for free shipping</p>}
            </div>

            <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-4">
              <span>Total</span><span>₹{total.toFixed(0)}</span>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 h-11 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </Link>
            <Link href="/products" className="text-center text-xs text-muted hover:text-ink">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
