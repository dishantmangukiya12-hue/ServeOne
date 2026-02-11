import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiSession } from "@/lib/api-auth";
// GET /api/export?restaurantId=xxx - Export all restaurant data as JSON
export async function GET(request: Request) {
  const session = await getApiSession(request);
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
  }

  // Verify authorization
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SEC: Only admin and manager can export data
  if (!session.user.role || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: "Only admins and managers can export data" }, { status: 403 });
  }

  try {
    // Fetch all data in parallel
    const [
      restaurant,
      categories,
      menuItems,
      orders,
      tables,
      users,
      reservations,
      inventory,
      expenses,
      customers,
    ] = await Promise.all([
      prisma.restaurant.findUnique({ where: { id: restaurantId } }),
      prisma.category.findMany({ where: { restaurantId } }),
      prisma.menuItem.findMany({ where: { restaurantId } }),
      prisma.order.findMany({ where: { restaurantId } }),
      prisma.table.findMany({ where: { restaurantId } }),
      prisma.user.findMany({ where: { restaurantId } }),
      prisma.reservation.findMany({ where: { restaurantId } }),
      prisma.inventoryItem.findMany({ where: { restaurantId } }),
      prisma.expense.findMany({ where: { restaurantId } }),
      prisma.customer.findMany({ where: { restaurantId } }),
    ]);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const exportData = {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        mobile: restaurant.mobile,
        // VULN-02 fix: Do not export passcodes
        address: restaurant.address,
        createdAt: restaurant.createdAt.toISOString(),
      },
      categories,
      menuItems: menuItems.map((item) => ({
        ...item,
        modifiers: item.modifiers as any,
      })),
      orders: orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        closedAt: order.closedAt?.toISOString() || null,
        items: order.items as any,
        auditLog: order.auditLog as any,
      })),
      tables,
      users: users.map((user) => {
        // VULN-02 fix: Strip passcodes from exported user data
        const { passcode: _, ...safeUser } = user;
        return {
          ...safeUser,
          lastLogin: user.lastLogin?.toISOString() || null,
        };
      }),
      reservations: reservations.map((res) => ({
        ...res,
        createdAt: res.createdAt.toISOString(),
      })),
      inventory,
      expenses,
      customers: customers.map((cust) => ({
        ...cust,
        lastVisit: cust.lastVisit?.toISOString() || null,
      })),
      settings: restaurant.settings as any,
      nextOrderNumber: restaurant.nextOrderNumber,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
