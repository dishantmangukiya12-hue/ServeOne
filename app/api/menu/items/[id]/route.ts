import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { updateMenuItemSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

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

  const parsed = updateMenuItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

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

    const { modifiers, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (modifiers !== undefined) {
      updateData.modifiers = modifiers === null ? Prisma.JsonNull : (modifiers as Prisma.InputJsonValue);
    }

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
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
