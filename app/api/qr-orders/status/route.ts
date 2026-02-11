import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/qr-orders/status?id=xxx — Public status check for a single QR order
// SEC: Only returns order status (no PII, no item details)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const order = await prisma.qROrder.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ id: order.id, status: order.status });
  } catch {
    return NextResponse.json({ error: "Failed to check order status" }, { status: 500 });
  }
}
