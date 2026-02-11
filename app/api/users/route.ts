import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { checkPlanLimit } from "@/lib/plan-check";
import { broadcastInvalidation } from "@/lib/sse";
import { createUserSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

// GET /api/users?restaurantId=xxx - List staff users
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

    const where = { restaurantId, deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          restaurantId: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          status: true,
          lastLogin: true,
          deletedAt: true,
          // SEC: Never expose passcode hash to client
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create staff user
export async function POST(request: Request) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  const body = await request.json();

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { restaurantId, name, email, mobile, passcode, role } = parsed.data;

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limit
  const planCheck = await checkPlanLimit(restaurantId, 'maxUsers');
  if (!planCheck.allowed) {
    return NextResponse.json({ error: planCheck.error, upgrade: true }, { status: 403 });
  }

  // Only admins can create other admins
  if (role === 'admin' && session?.user?.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can create admin users" }, { status: 403 });
  }

  // Check if mobile already exists within this restaurant
  const existing = await prisma.user.findFirst({
    where: { mobile, restaurantId },
  });

  if (existing) {
    return NextResponse.json({ error: "Mobile number already registered" }, { status: 409 });
  }

  // Hash the passcode
  const hashedPasscode = await bcrypt.hash(passcode, 12);

  const user = await prisma.user.create({
    data: {
      id: `user_${Date.now()}`,
      restaurantId,
      name,
      email: email || "",
      mobile,
      passcode: hashedPasscode,
      role,
      status: "active",
    },
  });

  broadcastInvalidation(restaurantId, "users");

  // SEC: Strip passcode from response
  const { passcode: _, ...safeUser } = user;
  return NextResponse.json({ user: safeUser }, { status: 201 });
}
