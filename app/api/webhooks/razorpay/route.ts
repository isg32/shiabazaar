import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

// ponytail: no body-parser config needed — Next.js 14 exposes raw body via req.text()
export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const body = await req.text();

  if (!verifyWebhookSignature(body, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      await db.order.updateMany({
        where: { razorpayOrderId: payment.order_id, status: "pending" },
        data:  { razorpayPaymentId: payment.id, status: "processing" },
      });
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      await db.order.updateMany({
        where: { razorpayOrderId: payment.order_id, status: "pending" },
        data:  { status: "cancelled" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
