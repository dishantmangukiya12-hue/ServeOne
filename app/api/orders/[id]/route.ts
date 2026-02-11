import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { updateOrderSchema } from "@/lib/validations";
import { broadcastInvalidation } from "@/lib/sse";
import { verifyCsrfToken } from "@/lib/csrf";

// VULN-18 fix: Define allowed order status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  active: ["preparing", "pending_payment", "cancelled"],
  preparing: ["ready", "pending_payment", "cancelled"],
  ready: ["served", "pending_payment", "cancelled"],
  served: ["pending_payment", "closed", "cancelled"],
  pending_payment: ["closed", "active", "cancelled"],
  closed: [], // terminal state
  cancelled: [], // terminal state
};

const VALID_STATUSES = Object.keys(VALID_STATUS_TRANSITIONS);

// GET /api/orders/[id] - Get single order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getApiSession(request);
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== order.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update order (items, customer, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const { id } = await params;
  const body = await request.json();

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== order.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      items,
      status,
      subTotal,
      tax,
      discount,
      total,
    } = parsed.data;

    const updateData: any = {};

    if (items !== undefined) updateData.items = items;
    // Use body for fields not in schema or if schema is partial? 
    // updateOrderSchema in lib/validations.ts doesn't have customer fields or adults/kids.
    // Let's rely on what IS in the schema for now, but the existing code updates other fields.
    // The schema SHOULD be updated to include these fields if they are allowed to be updated.
    // For now, I will keep the manual extraction for fields NOT in the schema to avoid breaking functionality,
    // BUT I will use parsed.data for fields that ARE in the schema.
    
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.customerMobile !== undefined) updateData.customerMobile = body.customerMobile;
    if (body.adults !== undefined) updateData.adults = body.adults;
    if (body.kids !== undefined) updateData.kids = body.kids;
    
    if (subTotal !== undefined) updateData.subTotal = subTotal;
    if (tax !== undefined) updateData.tax = tax;
    if (discount !== undefined) updateData.discount = discount;
    if (total !== undefined) updateData.total = total;

    // VULN-18 fix: Validate status transitions
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
      }
      const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from '${order.status}' to '${status}'` },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Add audit log entry
    const auditLog = Array.isArray(order.auditLog) ? order.auditLog : [];
    auditLog.push({
      id: `audit_${Date.now()}`,
      action: "ORDER_UPDATED",
      performedBy: session?.user?.name || "System",
      performedAt: new Date().toISOString(),
      details: `Order updated`,
    });
    updateData.auditLog = auditLog;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(order.restaurantId, "orders");
    if (status) broadcastInvalidation(order.restaurantId, "tables");

    return NextResponse.json({ order: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Cancel/delete order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const { id } = await params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== order.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update table status if order was active or pending_payment
    if (order.status !== "closed" && order.status !== "cancelled") {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: "available", currentOrderId: null },
      });
    }

    // Soft delete by marking as cancelled
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "cancelled",
        deletedAt: new Date(),
        auditLog: [
          ...(Array.isArray(order.auditLog) ? order.auditLog : []),
          {
            id: `audit_${Date.now()}`,
            action: "ORDER_CANCELLED",
            performedBy: session?.user?.name || "System",
            performedAt: new Date().toISOString(),
            details: "Order cancelled",
          },
        ],
      },
    });

    broadcastInvalidation(order.restaurantId, "orders");
    broadcastInvalidation(order.restaurantId, "tables");

    return NextResponse.json({ order: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}

// POST /api/orders/[id]/settle - Settle a pending payment order
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const { id } = await params;
  const body = await request.json();

  try {
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== order.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentMethod, amount } = body;

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method required" }, { status: 400 });
    }

    // Only allow settling orders with pending_payment status
    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: "Order is not in pending payment status" }, { status: 400 });
    }

    const auditLog = Array.isArray(order.auditLog) ? order.auditLog : [];
    auditLog.push({
      id: `audit_${Date.now()}`,
      action: "PAYMENT_SETTLED",
      performedBy: session?.user?.name || "System",
      performedAt: new Date().toISOString(),
      details: `Payment settled via ${paymentMethod} for ₹${amount || order.total}`,
    });

    // Update order to closed status
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: "closed",
        paymentMethod,
        closedAt: new Date(),
        auditLog,
      },
    });

    // Free up the table
    await prisma.table.update({
      where: { id: order.tableId },
      data: { status: "available", currentOrderId: null },
    });

    broadcastInvalidation(order.restaurantId, "orders");
    broadcastInvalidation(order.restaurantId, "tables");

    return NextResponse.json({ order: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to settle order" }, { status: 500 });
  }
}
