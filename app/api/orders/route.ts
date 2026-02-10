import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";

// GET /api/orders?restaurantId=xxx&status=xxx&date=xxx - List orders with filters
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where: any = { restaurantId, deletedAt: null };

    if (status) {
      const statuses = status.split(",");
      where.status = { in: statuses };
    }

    if (date) {
      where.createdAt = {
        gte: new Date(date),
        lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      };
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== data.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Atomically increment and get the next order number to prevent race conditions
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: data.restaurantId },
      data: { nextOrderNumber: { increment: 1 } },
      select: { nextOrderNumber: true },
    });

    // The returned value is AFTER increment, so the order number used is value - 1
    const orderNumber = updatedRestaurant.nextOrderNumber - 1;

    // Create order
    const order = await prisma.order.create({
      data: {
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerName: data.customerName || "Guest",
        customerMobile: data.customerMobile || "",
        adults: data.adults || 1,
        kids: data.kids || 0,
        items: data.items as unknown as Prisma.InputJsonValue,
        status: "active",
        channel: data.channel || "dineIn",
        subTotal: data.subTotal || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        total: data.total || 0,
        orderNumber,
        waiterName: data.waiterName || session?.user?.name || "System",
        createdAt: new Date(),
        auditLog: [
          {
            id: `audit_${Date.now()}`,
            action: "ORDER_CREATED",
            performedBy: session?.user?.name || "System",
            performedAt: new Date().toISOString(),
            details: `Order created with ${data.items.length} items`,
          },
        ],
      },
    });

    // Update table status
    await prisma.table.update({
      where: { id: data.tableId },
      data: { status: "occupied", currentOrderId: order.id },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
