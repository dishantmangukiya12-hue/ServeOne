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
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== item.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, unit, quantity, minThreshold, costPerUnit, supplier, lastRestocked } = body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
    if (minThreshold !== undefined) updateData.minThreshold = parseFloat(minThreshold);
    if (costPerUnit !== undefined) updateData.costPerUnit = parseFloat(costPerUnit);
    if (supplier !== undefined) updateData.supplier = supplier;
    if (lastRestocked !== undefined) updateData.lastRestocked = new Date(lastRestocked);

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(item.restaurantId, "inventory");

    return NextResponse.json({ item: updated });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== item.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    broadcastInvalidation(item.restaurantId, "inventory");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
  }
}
