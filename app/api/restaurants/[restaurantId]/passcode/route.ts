import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // SEC: Require authentication — only admin can change restaurant passcode
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can change the restaurant passcode" }, { status: 403 });
  }

  const body = await request.json();
  const passcode = body?.passcode as string | undefined;

  if (!passcode || passcode.length < 4) {
    return NextResponse.json(
      { error: "Passcode must be at least 4 characters" },
      { status: 400 }
    );
  }

  // SEC: Cap length to prevent bcrypt hash DoS (bcrypt truncates at 72 bytes anyway)
  if (passcode.length > 128) {
    return NextResponse.json(
      { error: "Passcode must be at most 128 characters" },
      { status: 400 }
    );
  }

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
