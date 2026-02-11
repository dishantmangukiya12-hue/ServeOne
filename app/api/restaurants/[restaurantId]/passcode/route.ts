
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { updatePasscodeSchema } from "@/lib/validations";
import { verifyCsrfToken } from "@/lib/csrf";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  if (!await verifyCsrfToken(request)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { restaurantId } = await params;

  // SEC: Require authentication — only admin can change restaurant passcode
  const session = await getApiSession(request);
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can change the restaurant passcode" }, { status: 403 });
  }

  const body = await request.json();
  
  const parsed = updatePasscodeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { passcode } = parsed.data;

  // Verify restaurant exists
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Hash the new passcode
  const hashedPasscode = await bcrypt.hash(passcode, 12);

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { passcode: hashedPasscode },
  });

  await prisma.user.updateMany({
    where: { restaurantId, role: "admin" },
    data: { passcode: hashedPasscode },
  });

  return NextResponse.json({ ok: true });
}

