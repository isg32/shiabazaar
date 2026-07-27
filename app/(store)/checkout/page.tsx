"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Lock, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth/client";

const steps = ["Address", "Payment"];

type ShippingQuote = { price: number; zone: string; label: string }; // price in rupees

type CartItem = {
  productId:  string;
  variantId:  string | null;
  qty:        number;
  title:      string;
  price:      number; // rupees
  coverImage: string;
  author:     string | null;
  type:       string;
};

declare global {
  interface Window {
    Razorpay: new (opts: object) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id  = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const session = authClient.useSession();
  const isLoggedIn = !!session.data?.user;
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState("");
  const [autoApplied, setAutoApplied] = useState(false); // true when coupon was auto-applied
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    line1: "", line2: "", city: "", state: "", pincode: "",
  });

  // Load cart (DB if logged in, localStorage if guest)
  useEffect(() => {
    fetch("/api/cart")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.items) { setCart(d.items); setCartLoaded(true); return; }
        // Guest fallback — localStorage
        try {
          const raw = localStorage.getItem("sb_cart");
          const local: { productId: string; variantId?: string | null; qty: number }[] = raw ? JSON.parse(raw) : [];
          setCart(local.map(i => ({
            productId:  i.productId,
            variantId:  i.variantId ?? null,
            qty:        i.qty,
            title:      "Product",
            price:      0,
            coverImage: "",
            author:     null,
            type:       "gift",
          })));
        } catch { /* empty */ }
        setCartLoaded(true);
      })
      .catch(() => setCartLoaded(true));
  }, []);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setFieldErrors(fe => {
      if (!fe[k]) return fe;
      const next = { ...fe };
      delete next[k];
      return next;
    });
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total     = subtotal + (shippingQuote?.price ?? 0);

  // Zonal delivery pricing — quote refreshes whenever the pincode changes to a valid 6-digit value.
  useEffect(() => {
    const pin = form.pincode.trim();
    let cancelled = false;

    const t = setTimeout(async () => {
      if (cancelled) return;
      if (!/^[1-9]\d{5}$/.test(pin)) {
        setShippingQuote(null);
        setShippingError("");
        setShippingLoading(false);
        return;
      }
      setShippingLoading(true);
      setShippingError("");
      try {
        const res = await fetch(`/api/shipping/check?pincode=${pin}`);
        const d = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setShippingQuote({ price: d.price / 100, zone: d.zone, label: d.label });
        } else {
          setShippingQuote(null);
          setShippingError(d.error ?? "Could not calculate delivery charge for this pincode.");
        }
      } catch {
        if (!cancelled) {
          setShippingQuote(null);
          setShippingError("Could not calculate delivery charge. Please try again.");
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [form.pincode]);

  // Auto-apply coupon: check whenever subtotal changes (subtotal is in rupees, API expects paise)
  useEffect(() => {
    if (subtotal <= 0) return;
    fetch(`/api/coupons/auto?subtotal=${Math.round(subtotal * 100)}`)
      .then(r => r.ok ? r.json() : null)
      .then(c => {
        if (c?.code) {
          setCouponApplied(c.code);
          setAutoApplied(true);
        } else if (autoApplied) {
          // subtotal dropped below threshold — remove the auto-applied coupon
          setCouponApplied("");
          setAutoApplied(false);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  function fieldCls(key: string) {
    const base = "w-full h-10 px-3 text-sm border rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:ring-2 transition-colors";
    return fieldErrors[key]
      ? `${base} border-error focus:border-error focus:ring-error/15`
      : `${base} border-hairline focus:border-primary focus:ring-primary/15`;
  }
  const labelCls = "text-xs font-medium text-muted uppercase tracking-wide block mb-1.5";
  const errorMsgCls = "text-sm text-error mt-1";

  const requiredFields: { key: "name" | "phone" | "line1" | "city" | "state" | "pincode"; label: string }[] = [
    { key: "name",    label: "Full Name" },
    { key: "phone",   label: "Phone" },
    { key: "line1",   label: "Full Address" },
    { key: "city",    label: "City" },
    { key: "state",   label: "State" },
    { key: "pincode", label: "PIN Code" },
  ];

  function validateAddress() {
    const errors: Record<string, boolean> = {};
    for (const f of requiredFields) {
      if (!form[f.key].trim()) errors[f.key] = true;
    }
    if (!errors.pincode && !shippingQuote) errors.pincode = true;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function placeOrder() {
    if (!validateAddress()) { setPlaceError("Please fill in all required address fields."); return; }
    setPlaceError("");
    setPlacing(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { setPlaceError("Failed to load payment gateway. Please try again."); setPlacing(false); return; }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            name:    form.name,
            phone:   form.phone,
            line1:   form.line1,
            line2:   form.line2 || undefined,
            city:    form.city,
            state:   form.state,
            pincode: form.pincode,
          },
          couponCode: couponApplied || undefined,
          guestCart: cart.map(i => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setPlaceError(d.error ?? "Failed to create order. Please try again.");
        setPlacing(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, keyId } = await res.json();

      const rzp = new window.Razorpay({
        key:         keyId,
        amount,
        currency:    "INR",
        order_id:    razorpayOrderId,
        name:        "Shia Bazaar",
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        prefill: {
          name:    form.name,
          email:   form.email || undefined,
          contact: form.phone,
        },
        theme: { color: "#cc785c" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          if (saveAddress && isLoggedIn) {
            fetch("/api/account/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: form.name, phone: form.phone, line1: form.line1, line2: form.line2 || undefined, city: form.city, state: form.state, pincode: form.pincode }),
            }).catch(() => {});
          }
          const vRes = await fetch("/api/orders/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const vData = await vRes.json();
          // Clear cart
          await fetch("/api/cart", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clear: true }) }).catch(() => {});
          localStorage.removeItem("sb_cart");
          router.push(`/order/${vData.orderId ?? orderId}`);
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setPlaceError("Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  if (!cartLoaded) {
    return (
      <div className="flex items-center justify-center py-32 gap-2 text-muted">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="display-sm text-ink mb-3">Your cart is empty</h1>
        <p className="text-muted text-sm mb-6">Add some products before checking out.</p>
        <Link href="/products" className="inline-flex h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors items-center">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      {/* Breadcrumb steps */}
      <nav className="flex items-center gap-2 mb-10 text-sm">
        <Link href="/cart" className="text-muted hover:text-ink">Cart</Link>
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <ChevronRight size={14} className="text-muted" />
            <span
              className={i === step ? "text-ink font-medium" : i < step ? "text-primary cursor-pointer hover:underline" : "text-muted"}
              onClick={() => i < step && setStep(i)}
            >
              {s}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <div className="flex-1">

          {/* Step 0 — Address */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <h1 className="display-sm text-ink">Delivery Address</h1>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input className={fieldCls("name")} placeholder="Enter your name" value={form.name} onChange={e => set("name", e.target.value)} />
                  {fieldErrors.name && <p className={errorMsgCls}>Full name is required.</p>}
                </div>
                <div>
                  <label className={labelCls}>Phone *</label>
                  <input className={fieldCls("phone")} type="tel" placeholder="Enter your phone number" value={form.phone} onChange={e => set("phone", e.target.value)} />
                  {fieldErrors.phone && <p className={errorMsgCls}>Phone number is required.</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Email (for order updates)</label>
                  <input className={fieldCls("email")} type="email" placeholder="Enter your email" value={form.email} onChange={e => set("email", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full Address *</label>
                  <input className={fieldCls("line1")} placeholder="Enter your full address" value={form.line1} onChange={e => set("line1", e.target.value)} />
                  {fieldErrors.line1 && <p className={errorMsgCls}>Address is required.</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Apt / Floor (optional)</label>
                  <input className={fieldCls("line2")} placeholder="Enter apartment or floor number" value={form.line2} onChange={e => set("line2", e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>City *</label>
                  <input className={fieldCls("city")} placeholder="Enter your city" value={form.city} onChange={e => set("city", e.target.value)} />
                  {fieldErrors.city && <p className={errorMsgCls}>City is required.</p>}
                </div>
                <div>
                  <label className={labelCls}>State *</label>
                  <select className={fieldCls("state")} value={form.state} onChange={e => set("state", e.target.value)}>
                    <option value="">Select state</option>
                    {[
  "Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh",
  "Assam","Bihar","Chandigarh","Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand",
  "Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
].map(s => <option key={s}>{s}</option>)}
                  </select>
                  {fieldErrors.state && <p className={errorMsgCls}>State is required.</p>}
                </div>
                <div>
                  <label className={labelCls}>PIN Code *</label>
                  <input className={fieldCls("pincode")} placeholder="Enter your PIN code" maxLength={6} inputMode="numeric" value={form.pincode} onChange={e => set("pincode", e.target.value)} />
                  {fieldErrors.pincode && !form.pincode.trim() ? (
                    <p className={errorMsgCls}>PIN code is required.</p>
                  ) : shippingLoading ? (
                    <p className="text-xs text-muted mt-1.5 flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin" /> Calculating delivery charge…
                    </p>
                  ) : shippingQuote ? (
                    <p className="text-xs text-success mt-1.5">
                      Delivery to {shippingQuote.label}: {shippingQuote.price === 0 ? "Free" : `₹${shippingQuote.price}`}
                    </p>
                  ) : shippingError ? (
                    <p className={errorMsgCls}>{shippingError}</p>
                  ) : null}
                </div>
              </div>
              {isLoggedIn && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={e => setSaveAddress(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="text-sm text-body">Save this address to my account</span>
                </label>
              )}
              <button
                onClick={() => { if (!validateAddress()) { setPlaceError("Please fill in all required fields."); } else { setPlaceError(""); setStep(1); } }}
                disabled={shippingLoading}
                className="self-start h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
              >
                Continue to Payment
              </button>
              {placeError && <p className="text-sm text-error">{placeError}</p>}
            </div>
          )}

          {/* Step 1 — Payment */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <h1 className="display-sm text-ink">Payment</h1>

              {/* Address summary */}
              <div className="bg-surface-card rounded-xl p-4 text-sm border border-hairline">
                <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Delivering to</p>
                <p className="font-medium text-ink">{form.name}</p>
                <p className="text-body mt-0.5">{form.line1}{form.line2 ? `, ${form.line2}` : ""}, {form.city}, {form.state} — {form.pincode}</p>
                <p className="text-muted mt-0.5">{form.phone}</p>
                {shippingQuote && (
                  <p className="text-muted mt-0.5">
                    Delivery ({shippingQuote.label}): {shippingQuote.price === 0 ? "Free" : `₹${shippingQuote.price}`}
                  </p>
                )}
                <button onClick={() => setStep(0)} className="text-primary text-xs hover:text-primary-active mt-1.5 transition-colors">Change</button>
              </div>

              {/* Coupon */}
              <div>
                <label className={labelCls}>Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    className={fieldCls("coupon")}
                    placeholder="ENTER CODE"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => { setCouponApplied(coupon); setAutoApplied(false); }}
                    className="h-10 px-4 text-sm font-medium border border-hairline rounded-md hover:bg-surface-card text-ink transition-colors shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && autoApplied && (
                  <p className="text-xs text-success mt-1.5">🎉 &quot;{couponApplied}&quot; auto-applied — discount calculated at checkout.</p>
                )}
                {couponApplied && !autoApplied && (
                  <p className="text-xs text-success mt-1.5">Coupon &quot;{couponApplied}&quot; applied — discount calculated at checkout.</p>
                )}
              </div>

              <div className="bg-surface-card rounded-xl p-5 border border-hairline">
                <div className="flex items-center gap-2 text-muted text-xs mb-4">
                  <Lock size={13} />
                  <span>Payments secured by Razorpay — UPI, Cards, Net Banking & Wallets</span>
                </div>
                <p className="text-sm text-body">
                  Click <strong>&quot;Pay ₹{total.toFixed(0)}&quot;</strong> to open Razorpay&apos;s secure checkout. You&apos;ll be able to pay via UPI, card, net banking, or wallet.
                </p>
              </div>

              {placeError && <p className="text-sm text-error">{placeError}</p>}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="h-11 px-6 border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors">
                  Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {placing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  {placing ? "Opening payment…" : `Pay ₹${total.toFixed(0)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Summary ──────────────────────────────────────────────── */}
        <div className="lg:w-72 shrink-0">
          <div className="bg-surface-card rounded-xl p-5 flex flex-col gap-4 sticky top-20">
            <h2 className="text-sm font-medium text-ink">Order Summary</h2>

            <div className="space-y-3">
              {cart.map(item => (
                <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex items-start gap-3">
                  {item.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverImage} alt="" className="w-10 h-10 rounded object-cover bg-surface-cream-strong shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-surface-cream-strong shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink line-clamp-2">{item.title}</p>
                    {item.author && <p className="text-[11px] text-muted">{item.author}</p>}
                    <p className="text-[11px] text-muted mt-0.5">Qty: {item.qty}</p>
                  </div>
                  <p className="text-xs font-medium text-ink shrink-0">₹{(item.price * item.qty).toFixed(0)}</p>
                </div>
              ))}
            </div>

            {subtotal < 1000 && (
              <p className="text-xs text-accent-amber font-medium -mt-1">
                Add ₹{(1000 - subtotal).toFixed(0)} more to get ₹100 off!
              </p>
            )}

            <div className="border-t border-hairline pt-3 space-y-1.5 text-sm text-body">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
              <div className="flex justify-between">
                <span>Shipping</span>
                {shippingLoading ? (
                  <span className="text-muted">Calculating…</span>
                ) : shippingQuote ? (
                  <span className={shippingQuote.price === 0 ? "text-success" : ""}>
                    {shippingQuote.price === 0 ? "Free" : `₹${shippingQuote.price}`}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </div>
              {couponApplied && (
                <div className="flex justify-between text-success text-xs"><span>Coupon: {couponApplied}</span><span>Applied</span></div>
              )}
            </div>
            <div className="flex justify-between font-semibold text-ink border-t border-hairline pt-3">
              <span>Total</span><span>₹{total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
