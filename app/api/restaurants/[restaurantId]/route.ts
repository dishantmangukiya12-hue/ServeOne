
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastInvalidation } from "@/lib/sse";
import { updateRestaurantSchema } from "@/lib/validations";

// GET /api/restaurants/[restaurantId] - Get restaurant details
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, mobile: true, address: true, settings: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch restaurant" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // Require authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const parsed = updateRestaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: parsed.data,
  });

  broadcastInvalidation(restaurantId, "restaurant");

  return NextResponse.json({ ok: true });
}

