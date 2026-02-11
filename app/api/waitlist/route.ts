import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createWaitlistSchema } from "@/lib/validations";
import { broadcastInvalidation } from "@/lib/sse";

// GET /api/waitlist?restaurantId=xxx - List active waitlist entries
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = { restaurantId, status: { in: ["waiting", "notified"] } };
    const [entries, total] = await Promise.all([
      prisma.waitlistEntry.findMany({
        where,
        orderBy: { addedAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.waitlistEntry.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 });
  }
}

// POST /api/waitlist - Add new waitlist entry
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createWaitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== data.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: {
        id: `wl_${Date.now()}`,
        restaurantId: data.restaurantId,
        customerName: data.customerName,
        customerMobile: data.customerMobile || "",
        partySize: data.partySize,
        estimatedWait: data.estimatedWait || 15,
        notes: data.notes || "",
        status: "waiting",
        addedAt: new Date(),
      },
    });

    broadcastInvalidation(data.restaurantId, "waitlist");

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create waitlist entry" }, { status: 500 });
  }
}
