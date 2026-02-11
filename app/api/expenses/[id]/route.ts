import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastInvalidation } from "@/lib/sse";

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const expense = await prisma.expense.findFirst({
      where: { id, restaurantId: session.user.restaurantId },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        ...(body.category !== undefined && { category: body.category }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.date !== undefined && { date: String(body.date) }),
        ...(body.paymentMethod !== undefined && { paymentMethod: body.paymentMethod }),
        ...(body.vendor !== undefined && { vendor: body.vendor }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.receiptUrl !== undefined && { receiptUrl: body.receiptUrl }),
      },
    });

    broadcastInvalidation(session.user.restaurantId, "expenses");

    return NextResponse.json({ expense: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Verify authorization
    if (!session?.user?.restaurantId || session.user.restaurantId !== expense.restaurantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    broadcastInvalidation(expense.restaurantId, "expenses");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
