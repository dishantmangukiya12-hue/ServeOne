import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastInvalidation } from "@/lib/sse";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const body = await request.json();

  try {
    const item = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== item.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      price,
      category,
      isVeg,
      dineIn,
      takeAway,
      homeDelivery,
      aggregators,
      description,
      modifiers,
      stockQuantity,
      lowStockThreshold,
      available,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseInt(price);
    if (category !== undefined) updateData.category = category;
    if (isVeg !== undefined) updateData.isVeg = isVeg;
    if (dineIn !== undefined) updateData.dineIn = dineIn;
    if (takeAway !== undefined) updateData.takeAway = takeAway;
    if (homeDelivery !== undefined) updateData.homeDelivery = homeDelivery;
    if (aggregators !== undefined) updateData.aggregators = aggregators;
    if (description !== undefined) updateData.description = description;
    if (modifiers !== undefined) updateData.modifiers = modifiers;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
    if (available !== undefined) updateData.available = available;

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(item.restaurantId, "menu-items");

    return NextResponse.json({ item: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

// DELETE /api/menu/items/[id] - Delete menu item
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const item = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== item.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent deleting menu items referenced in active orders
    const activeOrders = await prisma.order.findMany({
      where: { restaurantId: item.restaurantId, status: "active" },
      select: { items: true },
    });

    const isInActiveOrder = activeOrders.some((order) => {
      const orderItems = order.items as any[];
      return Array.isArray(orderItems) && orderItems.some((oi: any) => oi.id === id || oi.itemId === id);
    });

    if (isInActiveOrder) {
      return NextResponse.json(
        { error: "Cannot delete menu item that is in an active order. Close the order first." },
        { status: 409 }
      );
    }

    await prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcastInvalidation(item.restaurantId, "menu-items");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
