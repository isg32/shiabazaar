import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { decrementStockForPaidOrder, recordOnlinePayment, restockForCancelledOrder } from "@/lib/order-stock";

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
      const order = await db.order.findFirst({
        where: { razorpayOrderId: payment.order_id },
        select: { id: true },
      });
      if (order) {
        await recordOnlinePayment(order.id);
        await decrementStockForPaidOrder(order.id);
      }
    }
  }

  if (event.event === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id) {
      const order = await db.order.findFirst({
        where: { razorpayOrderId: payment.order_id },
        select: { id: true, status: true },
      });
      await db.order.updateMany({
        where: { razorpayOrderId: payment.order_id, status: "pending" },
        data:  { status: "cancelled" },
      });
      // If a prior capture had already decremented stock, put it back.
      if (order) await restockForCancelledOrder(order.id);
    }
  }

  return NextResponse.json({ ok: true });
}
