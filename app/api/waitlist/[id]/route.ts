import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT /api/waitlist/[id] - Update waitlist entry status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !["waiting", "notified", "seated", "left"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ entry: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update waitlist entry" }, { status: 500 });
  }
}

// DELETE /api/waitlist/[id] - Delete waitlist entry
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await prisma.waitlistEntry.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 });
  }
}
