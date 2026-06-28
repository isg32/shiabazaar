"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { featuredProducts } from "@/data/mock";
import type { Metadata } from "next";

// ponytail: mock cart seeded with 2 items — replaced by real cart store in Phase 3
const initialCart = [
  { ...featuredProducts[0], qty: 1 },
  { ...featuredProducts[1], qty: 2 },
];

export default function CartPage() {
  const [items, setItems] = useState(initialCart);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= 500 ? 0 : 99;
  const total = subtotal - discount + shipping;

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));

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
        {/* ── Cart items ──────────────────────────────── */}
        <div className="flex-1 divide-y divide-hairline">
          {items.map((item) => (
            <div key={item.id} className="py-6 flex gap-5">
              <div className="relative w-20 shrink-0 aspect-[3/4] rounded-lg overflow-hidden bg-surface-card border border-hairline">
                <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <p className="text-xs text-muted uppercase tracking-wide">{item.author ?? item.type}</p>
                <h3 className="text-sm font-medium text-ink leading-snug">{item.title}</h3>
                <p className="text-base font-semibold text-ink mt-1">₹{item.price}</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center border border-hairline rounded-md overflow-hidden">
                    <button
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card text-base"
                      onClick={() => item.qty > 1 ? setQty(item.id, item.qty - 1) : remove(item.id)}
                    >−</button>
                    <span className="w-8 text-center text-sm font-medium text-ink">{item.qty}</span>
                    <button
                      className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-card text-base"
                      onClick={() => setQty(item.id, item.qty + 1)}
                    >+</button>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-muted hover:text-error transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-ink">₹{item.price * item.qty}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Order summary ──────────────────────────── */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-surface-card rounded-xl p-6 flex flex-col gap-4 sticky top-20">
            <h2 className="text-base font-medium text-ink">Order Summary</h2>

            {/* Coupon */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="flex-1 h-9 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => coupon && setCouponApplied(true)}
                className="h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors"
              >
                Apply
              </button>
            </div>
            {couponApplied && (
              <p className="text-xs text-success">10% discount applied!</p>
            )}

            <div className="space-y-2 text-sm border-t border-hairline pt-4">
              <div className="flex justify-between text-body"><span>Subtotal</span><span>₹{subtotal}</span></div>
              {discount > 0 && <div className="flex justify-between text-success"><span>Discount</span><span>−₹{discount}</span></div>}
              <div className="flex justify-between text-body">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-success">Free</span> : `₹${shipping}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-muted">Add ₹{500 - subtotal} more for free shipping</p>
              )}
            </div>

            <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-4">
              <span>Total</span><span>₹{total}</span>
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
