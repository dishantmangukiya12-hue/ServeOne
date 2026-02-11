import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { FREE_TRIAL_DAYS } from "@/lib/plans";
import { createRestaurantSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();

  const parsed = createRestaurantSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const { restaurant, data } = parsed.data;

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

  // Fix data to use server-side IDs before storing
  const fixedData = { ...data } as any;
  if (fixedData.restaurant) {
    fixedData.restaurant = { ...fixedData.restaurant, id: restaurantId };
  }
  if (fixedData.users && Array.isArray(fixedData.users)) {
    fixedData.users = fixedData.users.map((u: any) => ({
      ...u,
      id: u.role === "admin" ? adminUserId : `user_${crypto.randomUUID()}`,
    }));
  }

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
        data: fixedData as unknown as Prisma.InputJsonValue,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, restaurantId });
}
