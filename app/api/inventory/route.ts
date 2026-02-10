import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInventorySchema } from "@/lib/validations";

// GET /api/inventory?restaurantId=xxx - List inventory items
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = { restaurantId };
    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory items" }, { status: 500 });
  }
}

// POST /api/inventory - Create inventory item
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createInventorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const { restaurantId, name, unit, quantity, minThreshold, costPerUnit, supplier } = data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await prisma.inventoryItem.create({
      data: {
        id: `inv_${Date.now()}`,
        restaurantId,
        name,
        unit,
        quantity,
        minThreshold: minThreshold ?? 10,
        costPerUnit: costPerUnit ?? 0,
        supplier: supplier || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}
