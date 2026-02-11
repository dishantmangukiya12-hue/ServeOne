import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTableSchema } from "@/lib/validations";
import { checkPlanLimit } from "@/lib/plan-check";
import { broadcastInvalidation } from "@/lib/sse";

// GET /api/tables?restaurantId=xxx - List tables
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

    const where = { restaurantId };
    const [tables, total] = await Promise.all([
      prisma.table.findMany({
        where,
        orderBy: { tableNumber: "asc" },
        skip,
        take: limit,
      }),
      prisma.table.count({ where }),
    ]);

    return NextResponse.json({ tables, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}

// POST /api/tables - Create table
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createTableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== data.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limit
  const planCheck = await checkPlanLimit(data.restaurantId, 'maxTables');
  if (!planCheck.allowed) {
    return NextResponse.json({ error: planCheck.error, upgrade: true }, { status: 403 });
  }

  try {
    const table = await prisma.table.create({
      data: {
        id: `table_${data.restaurantId}_${data.tableNumber}`,
        restaurantId: data.restaurantId,
        tableNumber: String(data.tableNumber).padStart(2, "0"),
        capacity: data.capacity || 4,
        status: data.status || "available",
      },
    });

    broadcastInvalidation(data.restaurantId, "tables");

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 });
  }
}

// DELETE /api/tables?restaurantId=xxx - Delete all tables for a restaurant
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.table.deleteMany({ where: { restaurantId } });
    broadcastInvalidation(restaurantId, "tables");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete tables" }, { status: 500 });
  }
}
