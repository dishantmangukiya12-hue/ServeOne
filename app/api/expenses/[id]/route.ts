import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
