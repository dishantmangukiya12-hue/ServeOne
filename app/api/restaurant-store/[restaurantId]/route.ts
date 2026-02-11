import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // SEC: Require authentication — public QR ordering uses /api/public/restaurant instead 
  const session = await getApiSession(request);
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.restaurantStore.findUnique({
    where: { restaurantId },
  });

  if (!store) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  return NextResponse.json({ data: store.data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // Require authentication for write operations
  const session = await getApiSession(request);
  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body?.data) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const store = await prisma.restaurantStore.upsert({
    where: { restaurantId },
    update: { data: body.data },
    create: { restaurantId, data: body.data },
  });

  return NextResponse.json({ data: store.data });
}
