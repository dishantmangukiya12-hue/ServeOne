import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { createMenuItemSchema } from "@/lib/validations";
import { broadcastInvalidation } from "@/lib/sse";
import { checkPlanLimit } from "@/lib/plan-check";
import { verifyCsrfToken } from "@/lib/csrf";

// GET /api/menu/items?restaurantId=xxx&category=xxx - List menu items
export async function GET(request: Request) {
  const session = await getApiSession(request);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const category = searchParams.get("category");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where: any = { restaurantId, deletedAt: null };
    if (category) {
      where.category = category;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "100")));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.menuItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

// POST /api/menu/items - Create menu item
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const body = await request.json();

  const parsed = createMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== data.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limit
  const planCheck = await checkPlanLimit(data.restaurantId, 'maxMenuItems');
  if (!planCheck.allowed) {
    return NextResponse.json({ error: planCheck.error, upgrade: true }, { status: 403 });
  }

  try {
    const item = await prisma.menuItem.create({
      data: {
        id: `item_${Date.now()}`,
        restaurantId: data.restaurantId,
        name: data.name,
        price: data.price,
        category: data.category,
        isVeg: data.isVeg,
        dineIn: data.dineIn,
        takeAway: data.takeAway,
        homeDelivery: data.homeDelivery,
        aggregators: data.aggregators,
        description: data.description || "",
        modifiers: data.modifiers ?? undefined,
        available: data.available,
      },
    });

    broadcastInvalidation(data.restaurantId, "menu-items");

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
