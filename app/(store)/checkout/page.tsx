"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import type { Metadata } from "next";

const steps = ["Address", "Shipping", "Payment"];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    address: "", city: "", state: "", pincode: "",
    shipping: "standard", saveAddress: false,
  });

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const inputCls = "w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";
  const labelCls = "text-xs font-medium text-muted uppercase tracking-wide block mb-1.5";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Breadcrumb steps */}
      <nav className="flex items-center gap-2 mb-10 text-sm">
        <Link href="/cart" className="text-muted hover:text-ink">Cart</Link>
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <ChevronRight size={14} className="text-muted" />
            <span className={i === step ? "text-ink font-medium" : i < step ? "text-primary cursor-pointer hover:underline" : "text-muted"} onClick={() => i < step && setStep(i)}>
              {s}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* ── Form ─────────────────────────────────── */}
        <div className="flex-1">

          {/* Step 0 — Address */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <h1 className="display-sm text-ink">Delivery Address</h1>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} placeholder="Ali Hussain" {...field("name")} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input className={inputCls} type="email" placeholder="ali@example.com" {...field("email")} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Phone</label>
                  <input className={inputCls} type="tel" placeholder="+91 98765 43210" {...field("phone")} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Street Address</label>
                  <input className={inputCls} placeholder="House / Flat no., Street name" {...field("address")} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input className={inputCls} placeholder="Mumbai" {...field("city")} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <select className={inputCls} {...field("state")}>
                    <option value="">Select state</option>
                    {["Maharashtra","Delhi","UP","Gujarat","Karnataka","Tamil Nadu","West Bengal"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>PIN Code</label>
                  <input className={inputCls} placeholder="400001" maxLength={6} {...field("pincode")} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-body cursor-pointer">
                <input type="checkbox" className="accent-[var(--color-primary)] w-4 h-4" />
                Save this address for future orders
              </label>

              <button
                onClick={() => setStep(1)}
                className="self-start h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
              >
                Continue to Shipping
              </button>
            </div>
          )}

          {/* Step 1 — Shipping */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h1 className="display-sm text-ink">Shipping Method</h1>
              <div className="space-y-3">
                {[
                  { id: "standard", label: "Standard Delivery", sub: "5–7 business days", price: "₹99" },
                  { id: "express",  label: "Express Delivery",  sub: "2–3 business days", price: "₹199" },
                  { id: "free",     label: "Free Shipping",     sub: "7–10 business days (orders ₹500+)", price: "Free" },
                ].map((opt) => (
                  <label key={opt.id} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${form.shipping === opt.id ? "border-primary bg-surface-soft" : "border-hairline bg-canvas hover:bg-surface-soft"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value={opt.id} checked={form.shipping === opt.id} onChange={() => setForm(f => ({...f, shipping: opt.id}))} className="accent-[var(--color-primary)]" />
                      <div>
                        <p className="text-sm font-medium text-ink">{opt.label}</p>
                        <p className="text-xs text-muted mt-0.5">{opt.sub}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${opt.price === "Free" ? "text-success" : "text-ink"}`}>{opt.price}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="h-11 px-6 border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(2)} className="h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h1 className="display-sm text-ink">Payment</h1>
              <div className="bg-surface-dark rounded-xl p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-on-dark-soft text-xs">
                  <Lock size={13} />
                  <span>Secured by Razorpay — your card details are never stored</span>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-xs font-medium text-on-dark-soft uppercase tracking-wide block mb-1.5">Card Number</label>
                    <input className="w-full h-10 px-3 text-sm border border-white/10 rounded-md bg-surface-dark-elevated text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-on-dark-soft uppercase tracking-wide block mb-1.5">Expiry</label>
                      <input className="w-full h-10 px-3 text-sm border border-white/10 rounded-md bg-surface-dark-elevated text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="MM / YY" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-on-dark-soft uppercase tracking-wide block mb-1.5">CVV</label>
                      <input className="w-full h-10 px-3 text-sm border border-white/10 rounded-md bg-surface-dark-elevated text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="•••" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-on-dark-soft mt-1">UPI, Net Banking & Wallets also available at checkout</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="h-11 px-6 border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
                  Back
                </button>
                <Link
                  href="/order/SB-20250628-001"
                  className="h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors inline-flex items-center gap-2"
                >
                  <Lock size={14} /> Place Order
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Mini order summary ─────────────────────── */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-surface-card rounded-xl p-5 flex flex-col gap-3 sticky top-20">
            <h2 className="text-sm font-medium text-ink">Order Summary</h2>
            <div className="space-y-1.5 text-sm text-body">
              <div className="flex justify-between"><span>2 items</span><span>₹1,248</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>₹99</span></div>
            </div>
            <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-3">
              <span>Total</span><span>₹1,347</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
