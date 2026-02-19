import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { verifyCsrfToken } from "@/lib/csrf";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request))
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const session = await getApiSession(request);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !["approved", "rejected", "pending_approval"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const order = await prisma.qROrder.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.qROrder.update({
      where: { id },
      data: { status },
    });

    broadcastInvalidation(session.user.restaurantId, "qr-orders");

    return NextResponse.json({ order: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update QR order" }, { status: 500 });
  }
}

// DELETE /api/qr-orders/[id] - Delete QR order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request))
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const session = await getApiSession(request);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await prisma.qROrder.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.qROrder.delete({
      where: { id },
    });

    broadcastInvalidation(session.user.restaurantId, "qr-orders");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete QR order" }, { status: 500 });
  }
}
