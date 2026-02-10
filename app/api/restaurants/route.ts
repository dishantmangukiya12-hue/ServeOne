import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { FREE_TRIAL_DAYS } from "@/lib/plans";

export async function POST(request: Request) {
  const body = await request.json();
  const restaurant = body?.restaurant as {
    id: string;
    name: string;
    mobile: string;
    passcode: string;
    address?: string;
    createdAt: string;
  } | undefined;
  const data = body?.data as Record<string, unknown> | undefined;

  if (!restaurant || !data) {
    return NextResponse.json({ error: "Missing restaurant data" }, { status: 400 });
  }

  const existing = await prisma.restaurant.findUnique({
    where: { mobile: restaurant.mobile },
  });

  if (existing) {
    return NextResponse.json({ error: "Restaurant already exists" }, { status: 409 });
  }

  // Hash the passcode
  const hashedPasscode = await bcrypt.hash(restaurant.passcode, 12);

  // VULN-10 fix: Generate IDs server-side instead of trusting client
  const restaurantId = `rest_${crypto.randomUUID()}`;
  const adminUserId = `user_${crypto.randomUUID()}`;

  const adminUser = (data as any).users?.find((user: any) => user.role === "admin") ?? {
    name: "Admin",
    email: "",
    mobile: restaurant.mobile,
    role: "admin",
    status: "active",
  };

  await prisma.$transaction([
    prisma.restaurant.create({
      data: {
        id: restaurantId,
        name: restaurant.name,
        mobile: restaurant.mobile,
        passcode: hashedPasscode,
        address: restaurant.address,
        createdAt: new Date(restaurant.createdAt),
        settings: (data as any).settings ?? {},
        nextOrderNumber: (data as any).nextOrderNumber ?? 1,
        plan: "starter",
        trialEndsAt: new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000),
        planExpiresAt: new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        id: adminUserId,
        restaurantId: restaurantId,
        name: adminUser.name ?? "Admin",
        email: adminUser.email ?? "",
        mobile: adminUser.mobile ?? restaurant.mobile,
        passcode: hashedPasscode,
        role: adminUser.role ?? "admin",
        status: adminUser.status ?? "active",
      },
    }),
    prisma.restaurantStore.create({
      data: {
        restaurantId: restaurantId,
        data: data as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
