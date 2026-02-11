import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCustomerSchema } from "@/lib/validations";
import { broadcastInvalidation } from "@/lib/sse";

// GET /api/customers?restaurantId=xxx&search=xxx - List customers
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const search = searchParams.get("search");

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

    const where: any = { restaurantId, deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { visits: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({ customers, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers - Create or update customer
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const data = parsed.data;

  const {
    restaurantId,
    name,
    mobile,
    email,
    birthDate,
    anniversaryDate,
    preferences,
    loyaltyPoints,
    tier,
  } = data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if customer already exists
    const existing = await prisma.customer.findFirst({
      where: { restaurantId, mobile },
    });

    if (existing) {
      // Update existing customer
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          name,
          email: email || existing.email,
          birthDate: birthDate || existing.birthDate,
          anniversaryDate: anniversaryDate || existing.anniversaryDate,
          preferences: preferences || existing.preferences,
          loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : existing.loyaltyPoints,
          tier: tier || existing.tier,
          visits: existing.visits + 1,
          lastVisit: new Date(),
        },
      });
      return NextResponse.json({ customer: updated });
    }

    // Create new customer
    const customer = await prisma.customer.create({
      data: {
        id: `cust_${Date.now()}`,
        restaurantId,
        name,
        mobile,
        email: email || "",
        birthDate: birthDate || null,
        anniversaryDate: anniversaryDate || null,
        preferences: preferences || null,
        loyaltyPoints: loyaltyPoints || 0,
        tier: tier || "bronze",
        visits: 1,
        totalSpent: 0,
        lastVisit: new Date(),
      },
    });

    broadcastInvalidation(restaurantId, "customers");

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
