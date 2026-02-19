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
  const body = await request.json();

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== category.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, icon, sortingOrder } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;
    if (sortingOrder !== undefined) updateData.sortingOrder = sortingOrder;

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(category.restaurantId, "categories");

    return NextResponse.json({ category: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/menu/categories/[id] - Delete category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request))
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const session = await getApiSession(request);
  const { id } = await params;

  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== category.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.category.delete({
      where: { id },
    });

    broadcastInvalidation(category.restaurantId, "categories");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
