import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { createAttendanceSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

// GET /api/attendance?restaurantId=xxx&date=xxx - List attendance records
export async function GET(request: Request) {
  const session = await getApiSession(request);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where: Record<string, unknown> = { restaurantId };
    if (date) {
      where.date = date;
    }

    const attendance = await prisma.staffAttendance.findMany({
      where,
      orderBy: { checkIn: "desc" },
      take: 500, // SEC: Pagination limit to prevent unbounded queries
    });

    return NextResponse.json({ attendance, total: attendance.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// POST /api/attendance - Check in staff
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getApiSession(request);
  const body = await request.json();

  const parsed = createAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { restaurantId, userId, date } = parsed.data;

  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // SEC: Verify userId belongs to this restaurant
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, restaurantId, deletedAt: null },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found in this restaurant" }, { status: 404 });
    }

    const today = date || new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const existing = await prisma.staffAttendance.findFirst({
      where: { userId, restaurantId, date: today },
    });

    if (existing && !existing.checkOut) {
      return NextResponse.json({ error: "Already checked in" }, { status: 409 });
    }

    const entry = await prisma.staffAttendance.create({
      data: {
        id: `att_${Date.now()}`,
        userId,
        restaurantId,
        date: today,
        checkIn: new Date(),
        status: "present",
      },
    });

    broadcastInvalidation(restaurantId, "attendance");

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }
}
