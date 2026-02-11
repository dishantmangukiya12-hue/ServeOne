import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastInvalidation } from "@/lib/sse";
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const body = await request.json();

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== customer.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      email,
      mobile,
      birthDate,
      anniversaryDate,
      preferences,
      loyaltyPoints,
      tier,
      visits,
      totalSpent,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (anniversaryDate !== undefined) updateData.anniversaryDate = anniversaryDate;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (loyaltyPoints !== undefined) updateData.loyaltyPoints = loyaltyPoints;
    if (tier !== undefined) updateData.tier = tier;
    if (visits !== undefined) updateData.visits = visits;
    if (totalSpent !== undefined) updateData.totalSpent = totalSpent;

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    broadcastInvalidation(customer.restaurantId, "customers");

    return NextResponse.json({ customer: updated });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== customer.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    broadcastInvalidation(customer.restaurantId, "customers");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
