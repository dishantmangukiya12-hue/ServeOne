import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastInvalidation } from "@/lib/sse";
import { updateWaitlistSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const parsed = updateWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { status, customerName, customerMobile, partySize, estimatedWait, notes } = parsed.data;

  try {
    const entry = await prisma.waitlistEntry.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerMobile !== undefined) updateData.customerMobile = customerMobile;
    if (partySize !== undefined) updateData.partySize = partySize;
    if (estimatedWait !== undefined) updateData.estimatedWait = estimatedWait;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.waitlistEntry.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(session.user.restaurantId, "waitlist");

    return NextResponse.json({ entry: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update waitlist entry" }, { status: 500 });
  }
}

// DELETE /api/waitlist/[id] - Delete waitlist entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

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

    broadcastInvalidation(session.user.restaurantId, "waitlist");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 });
  }
}
