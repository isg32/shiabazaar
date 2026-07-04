import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";

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
  return NextResponse.json({ orderId: order?.id });
}
