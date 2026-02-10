import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession, mockStaffSession, mockNoSession } from "../helpers/mock-session";
import { mockPrisma, resetPrismaMocks } from "../helpers/mock-prisma";

async function callGET(params: string) {
  const { GET } = await import("@/app/api/orders/route");
  const request = new Request(`http://localhost/api/orders?${params}`);
  return GET(request);
}

async function callPOST(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/orders/route");
  const request = new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

async function callPUT(id: string, body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/orders/[id]/route");
  const request = new Request(`http://localhost/api/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return PUT(request, { params: Promise.resolve({ id }) });
}

describe("Orders API - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaMocks();
  });

  // T11: PUT with status "closed" to skip payment flow
  it("T11: PUT should validate status transitions (VULN-18)", async () => {
    mockSession({ restaurantId: "rest_123" });

    mockPrisma.order.findUnique.mockResolvedValue({
      id: "order_1",
      restaurantId: "rest_123",
      status: "active",
      tableId: "table_1",
      auditLog: [],
    });

    mockPrisma.order.update.mockResolvedValue({
      id: "order_1",
      status: "closed", // Should NOT allow direct jump from active to closed
    });

    const response = await callPUT("order_1", { status: "closed" });
    const data = await response.json();

    // FIXED (VULN-18): Cannot jump directly from "active" to "closed"
    expect(response.status).toBe(400);
    expect(data.error).toContain("Cannot transition");
  });

  // T12: POST with empty items array
  it("T12: POST should reject order with empty items array", async () => {
    mockSession({ restaurantId: "rest_123" });

    const response = await callPOST({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [],
      total: 0,
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("At least one item required");
  });

  // T13: PUT with negative total
  it("T13: PUT should reject negative total values", async () => {
    mockSession({ restaurantId: "rest_123" });

    mockPrisma.order.findUnique.mockResolvedValue({
      id: "order_1",
      restaurantId: "rest_123",
      status: "active",
      tableId: "table_1",
      auditLog: [],
    });

    const response = await callPUT("order_1", { total: -500 });

    // updateOrderSchema has z.number().min(0) on total, so negative values
    // are correctly rejected at the Zod validation layer
    expect(response.status).toBe(400);
  });

  // T14: POST order with mismatched restaurantId
  it("T14: POST should reject order with restaurantId not matching session", async () => {
    mockSession({ restaurantId: "rest_123" });

    const response = await callPOST({
      restaurantId: "rest_DIFFERENT",
      tableId: "table_1",
      items: [{ id: "item_1", name: "Burger", qty: 1, price: 100 }],
      total: 100,
    });

    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});
