import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
// GET /api/reports/summary?restaurantId=xxx&date=xxx - Get daily summary stats
export async function GET(request: Request) {
  const session = await getApiSession(request);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const date = searchParams.get("date"); // YYYY-MM-DD format

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const targetDate = date || new Date().toISOString().split("T")[0];
    const startOfDay = new Date(targetDate);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get orders for the date
    const orders = await prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Calculate stats
    const activeOrders = orders.filter((o) => o.status === "active");
    const closedOrders = orders.filter((o) => o.status === "closed");
    const cancelledOrders = orders.filter((o) => o.status === "cancelled");

    const totalSales = closedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSubTotal = closedOrders.reduce((sum, o) => sum + o.subTotal, 0);
    const totalTax = closedOrders.reduce((sum, o) => sum + o.tax, 0);
    const totalDiscount = closedOrders.reduce((sum, o) => sum + o.discount, 0);

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    closedOrders.forEach((o) => {
      const method = o.paymentMethod || "Cash";
      paymentMethods[method] = (paymentMethods[method] || 0) + o.total;
    });

    // Channel breakdown
    const channels: Record<string, number> = {};
    orders.forEach((o) => {
      const channel = o.channel || "dineIn";
      channels[channel] = (channels[channel] || 0) + 1;
    });

    // Get expenses for the date
    const expenses = await prisma.expense.findMany({
      where: {
        restaurantId,
        date: targetDate,
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      date: targetDate,
      summary: {
        totalOrders: orders.length,
        activeOrders: activeOrders.length,
        closedOrders: closedOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalSales,
        totalSubTotal,
        totalTax,
        totalDiscount,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        avgOrderValue: closedOrders.length ? Math.round(totalSales / closedOrders.length) : 0,
      },
      paymentMethods,
      channels,
      expenses: {
        total: totalExpenses,
        breakdown: expenses.reduce((acc, e) => {
          const cat = e.category || "other";
          acc[cat] = (acc[cat] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
