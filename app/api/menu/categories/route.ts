import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validations";

// GET /api/menu/categories?restaurantId=xxx - List categories
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
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      orderBy: { sortingOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/menu/categories - Create category
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== data.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get max sorting order if not provided
    let order = data.sortingOrder;
    if (order === undefined) {
      const lastCategory = await prisma.category.findFirst({
        where: { restaurantId: data.restaurantId },
        orderBy: { sortingOrder: "desc" },
      });
      order = (lastCategory?.sortingOrder || 0) + 1;
    }

    const category = await prisma.category.create({
      data: {
        id: `cat_${Date.now()}`,
        restaurantId: data.restaurantId,
        name: data.name,
        icon: data.icon || "🍽️",
        sortingOrder: order,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
