import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { decrementStockForPaidOrder, recordOnlinePayment } from "@/lib/order-stock";

export async function POST(req: NextRequest) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await db.order.updateMany({
    where: { razorpayOrderId, status: "pending" },
    data:  { razorpayPaymentId, status: "processing" },
  });

  const order = await db.order.findFirst({ where: { razorpayOrderId } });

  // Draw down the shared stock pool now that payment is confirmed. Idempotent —
  // the webhook may also run this for the same order.
  if (order) {
    await recordOnlinePayment(order.id);
    await decrementStockForPaidOrder(order.id);
  }

  return NextResponse.json({ orderId: order?.id });
}
