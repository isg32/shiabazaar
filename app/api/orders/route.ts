import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user-sync";
import { razorpay } from "@/lib/razorpay";
import { quoteShippingForPincode } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  const { data: session } = await auth.getSession();
  const body = await req.json();

  const { address, couponCode, guestCart } = body as {
    address: {
      name: string; phone: string; line1: string; line2?: string;
      city: string; state: string; pincode: string;
    };
    couponCode?: string;
    guestCart?: { productId: string; variantId?: string | null; qty: number }[];
  };

  if (!address?.name || !address?.line1 || !address?.city || !address?.pincode) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }

  let shippingAmount: number;
  try {
    shippingAmount = (await quoteShippingForPincode(address.pincode)).price;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not calculate shipping for this pincode.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Resolve cart items ────────────────────────────────────────────────────

  let userId: string | null = null;
  let cartRows: { productId: string; variantId: string | null; qty: number }[] = [];

  if (session?.user) {
    userId = await ensureUser(session.user.email, session.user.name);
    const dbCart = await db.cartItem.findMany({
      where: { userId },
      select: { productId: true, variantId: true, qty: true },
    });
    cartRows = dbCart.map(r => ({ productId: r.productId, variantId: r.variantId, qty: r.qty }));
  } else if (guestCart?.length) {
    cartRows = guestCart.map(r => ({ productId: r.productId, variantId: r.variantId ?? null, qty: r.qty }));
  }

  if (cartRows.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // ── Fetch product prices ──────────────────────────────────────────────────

  const productIds = [...new Set(cartRows.map(r => r.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, price: true, originalPrice: true, variants: { select: { id: true, price: true } } },
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  const lineItems = cartRows.map(row => {
    const p = productMap.get(row.productId);
    if (!p) throw new Error(`Product ${row.productId} not found`);
    const variantPrice = row.variantId
      ? p.variants.find(v => v.id === row.variantId)?.price ?? null
      : null;
    const unitPrice = variantPrice ?? p.price;
    // A struck-through "original price" on the storefront is the MRP; variants have no MRP of their own.
    const mrp = variantPrice === null && p.originalPrice && p.originalPrice > unitPrice ? p.originalPrice : unitPrice;
    return { productId: row.productId, variantId: row.variantId, qty: row.qty, title: p.title, mrp, price: unitPrice };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.price * i.qty, 0);

  // ── Coupon ────────────────────────────────────────────────────────────────

  let discountAmount = 0;
  if (couponCode) {
    const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
        subtotal >= coupon.minOrder) {
      discountAmount = coupon.type === "percent"
        ? Math.round(subtotal * coupon.value / 100)
        : coupon.value;
      discountAmount = Math.min(discountAmount, subtotal);
    }
  }

  const total = subtotal - discountAmount + shippingAmount;

  // ── Address record ────────────────────────────────────────────────────────

  const addressRecord = userId
    ? await db.address.create({
        data: {
          userId,
          name:    address.name,
          phone:   address.phone,
          line1:   address.line1,
          line2:   address.line2 ?? null,
          city:    address.city,
          state:   address.state,
          pincode: address.pincode,
        },
      })
    : null;

  // ── Razorpay order ────────────────────────────────────────────────────────

  const rzpOrder = await razorpay.orders.create({
    amount:   total,
    currency: "INR",
    receipt:  `sb_${Date.now()}`,
  });

  // ── DB Order ──────────────────────────────────────────────────────────────

  const order = await db.order.create({
    data: {
      userId,
      addressId:      addressRecord?.id ?? null,
      subtotal,
      discountAmount,
      shippingAmount,
      total,
      couponCode:     couponCode ?? null,
      razorpayOrderId: rzpOrder.id,
      status:         "pending",
      items: {
        create: lineItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          title:     i.title,
          mrp:       i.mrp,
          price:     i.price,
          qty:       i.qty,
        })),
      },
    },
  });

  // Increment coupon usage
  if (couponCode && discountAmount > 0) {
    await db.coupon.update({
      where: { code: couponCode.toUpperCase() },
      data:  { usageCount: { increment: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json({
    orderId:        order.id,
    razorpayOrderId: rzpOrder.id,
    amount:         total,
    currency:       "INR",
    keyId:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  }, { status: 201 });
}
