import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createExpenseSchema } from "@/lib/validations";

// GET /api/expenses?restaurantId=xxx&date=xxx - List expenses
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

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({ expenses, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST /api/expenses - Create expense
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const { restaurantId, category, amount, description, date, createdBy } = data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        id: `exp_${Date.now()}`,
        restaurantId,
        category: category || "other",
        amount,
        description,
        date,
        createdBy: createdBy || session?.user?.name || "System",
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
