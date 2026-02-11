import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createQROrderSchema } from "@/lib/validations";
import { broadcastInvalidation } from "@/lib/sse";
import { verifyCsrfToken } from "@/lib/csrf";

// GET /api/qr-orders?restaurantId=xxx - List pending QR orders (staff only)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // SEC: Require authentication — no unauthenticated access to order data with PII
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = { restaurantId, status: { in: ["pending_approval", "approved"] } };
    const [orders, total] = await Promise.all([
      prisma.qROrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.qROrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch QR orders" }, { status: 500 });
  }
}

// POST /api/qr-orders - Create new QR order (public, no auth required)
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = createQROrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  try {
    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Verify table exists and belongs to restaurant
    const table = await prisma.table.findFirst({
      where: { id: data.tableId, restaurantId: data.restaurantId },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const order = await prisma.qROrder.create({
      data: {
        id: `qr_${Date.now()}`,
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        tableNumber: data.tableNumber || table.tableNumber,
        customerName: data.customerName || "Guest",
        customerMobile: data.customerMobile || "",
        items: data.items as unknown as Prisma.InputJsonValue,
        total: data.total,
        status: "pending_approval",
        createdAt: new Date(),
      },
    });

    broadcastInvalidation(data.restaurantId, "qr-orders");

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create QR order" }, { status: 500 });
  }
}
