import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReservationSchema } from "@/lib/validations";

// GET /api/reservations?restaurantId=xxx&date=xxx - List reservations
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const where: any = { restaurantId };
    if (date) {
      where.date = date;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        orderBy: [{ date: "asc" }, { time: "asc" }],
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json({ reservations, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
  }
}

// POST /api/reservations - Create reservation
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createReservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const { restaurantId, customerName, customerMobile, partySize, date, time, tableId, notes, status } = data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reservation = await prisma.reservation.create({
      data: {
        id: `res_${Date.now()}`,
        restaurantId,
        customerName,
        customerMobile: customerMobile || "",
        partySize,
        date,
        time,
        tableId: tableId || null,
        notes: notes || "",
        status: status || "confirmed",
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
  }
}
