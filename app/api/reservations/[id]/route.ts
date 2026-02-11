import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { updateReservationSchema } from "@/lib/validations";
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

  const parsed = updateReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

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

    const { status, tableId, notes, customerName, customerMobile, partySize, date, time } = parsed.data;
    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (tableId !== undefined) updateData.tableId = tableId;
    if (notes !== undefined) updateData.notes = notes;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerMobile !== undefined) updateData.customerMobile = customerMobile;
    if (partySize !== undefined) updateData.partySize = partySize;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(reservation.restaurantId, "reservations");

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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
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

    broadcastInvalidation(reservation.restaurantId, "reservations");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
  }
}
