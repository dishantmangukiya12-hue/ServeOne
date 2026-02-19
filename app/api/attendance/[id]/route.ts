import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { verifyCsrfToken } from "@/lib/csrf";

// PUT /api/attendance/[id] - Check out / update attendance
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyCsrfToken(request))
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });

  const session = await getApiSession(request);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const entry = await prisma.staffAttendance.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!entry) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const ALLOWED_STATUSES = ['present', 'absent', 'late', 'half-day'];
    const updateData: Record<string, unknown> = {};
    if (body.checkOut !== undefined) updateData.checkOut = new Date(body.checkOut);
    if (body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // Default: set checkout to now
    if (Object.keys(updateData).length === 0) {
      updateData.checkOut = new Date();
    }

    const updated = await prisma.staffAttendance.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(session.user.restaurantId, "attendance");

    return NextResponse.json({ entry: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
