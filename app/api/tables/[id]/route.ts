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
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== table.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, capacity, currentOrderId, mergedWith } = body;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (currentOrderId !== undefined) updateData.currentOrderId = currentOrderId;
    if (mergedWith !== undefined) updateData.mergedWith = mergedWith;

    const updated = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(table.restaurantId, "tables");

    return NextResponse.json({ table: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 });
  }
}

// DELETE /api/tables/[id] - Delete table
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== table.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent deleting a table with an active order
    if (table.currentOrderId) {
      return NextResponse.json(
        { error: "Cannot delete table with an active order. Close the order first." },
        { status: 409 }
      );
    }

    await prisma.table.delete({
      where: { id },
    });

    broadcastInvalidation(table.restaurantId, "tables");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 });
  }
}
