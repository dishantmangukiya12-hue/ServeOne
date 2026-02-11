
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import { broadcastInvalidation } from "@/lib/sse";
import { updateRestaurantSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

// GET /api/restaurants/[restaurantId] - Get restaurant details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  const session = await getApiSession(request);
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
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { restaurantId } = await params;

  // Require authentication
  const session = await getApiSession(request);
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

  const { settings, ...rest } = parsed.data as any;

  // If settings are provided, merge with existing settings instead of overwriting
  let updateData: any = { ...rest };
  if (settings) {
    const existing = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { settings: true },
    });
    const existingSettings = (existing?.settings as Record<string, unknown>) || {};
    updateData.settings = { ...existingSettings, ...settings };
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: updateData,
  });

  broadcastInvalidation(restaurantId, "restaurant");

  return NextResponse.json({ ok: true });
}

