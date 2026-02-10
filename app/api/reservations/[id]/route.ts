import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/reservations/[id] - Update reservation (seat, cancel, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const body = await request.json();

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== reservation.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status, tableId, notes } = body;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (tableId !== undefined) updateData.tableId = tableId;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ reservation: updated });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Cancel/delete reservation
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== reservation.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.reservation.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}
