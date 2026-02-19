import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/restaurant/[restaurantId] — Public endpoint for QR ordering
// Returns restaurant name, categories, menu items (dine-in, available), and tables
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  try {
    const [restaurant, categories, menuItems, tables] = await Promise.all([
      prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { id: true, name: true, settings: true },
      }),
      prisma.category.findMany({
        where: { restaurantId },
        orderBy: { sortingOrder: "asc" },
        select: { id: true, name: true, icon: true },
      }),
      prisma.menuItem.findMany({
        where: {
          restaurantId,
          available: true,
          dineIn: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: true,
          isVeg: true,
          image: true,
        },
      }),
      prisma.table.findMany({
        where: { restaurantId },
        select: { id: true, tableNumber: true }, // SEC: Don't expose occupancy status publicly
      }),
    ]);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Map menu items to include category as categoryId string
    const mappedItems = menuItems.map((item) => ({
      ...item,
      available: true,
      dineIn: true,
    }));

    const settings = restaurant.settings as Record<string, unknown> | null;

    return NextResponse.json({
      restaurant: { id: restaurant.id, name: restaurant.name },
      categories,
      menuItems: mappedItems,
      tables,
      settings: {
        currency: (settings?.currency as string) ?? "₹",
        taxRate: (settings?.taxRate as number) ?? 5,
        // SEC: Only expose tax config needed for price display, not internal tax details
        tax: settings?.tax ? { enabled: (settings.tax as Record<string, unknown>)?.enabled, rate: (settings.tax as Record<string, unknown>)?.rate } : null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch restaurant data" },
      { status: 500 }
    );
  }
}
