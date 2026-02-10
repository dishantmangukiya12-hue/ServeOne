import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // Public access allowed for QR ordering, but only expose menu data for unauthenticated users
  const session = await getServerSession(authOptions);
  if (session?.user?.restaurantId && session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const store = await prisma.restaurantStore.findUnique({
    where: { restaurantId },
  });

  if (!store) {
    return NextResponse.json({ data: null }, { status: 404 });
  }

  // If unauthenticated (QR ordering), only expose menu data, not sensitive info
  if (!session?.user?.restaurantId) {
    const data = store.data as Record<string, unknown> | null;
    if (data) {
      return NextResponse.json({
        data: {
          restaurant: { id: (data.restaurant as Record<string, unknown>)?.id, name: (data.restaurant as Record<string, unknown>)?.name },
          categories: data.categories,
          menuItems: data.menuItems,
          tables: data.tables,
          settings: { currency: (data.settings as Record<string, unknown>)?.currency, taxRate: (data.settings as Record<string, unknown>)?.taxRate, tax: (data.settings as Record<string, unknown>)?.tax },
        },
      });
    }
  }

  return NextResponse.json({ data: store.data });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // Require authentication for write operations
  const session = await getServerSession(authOptions);
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
