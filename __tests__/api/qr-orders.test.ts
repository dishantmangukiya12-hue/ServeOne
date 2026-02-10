import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession, mockNoSession } from "../helpers/mock-session";
import { mockPrisma, resetPrismaMocks } from "../helpers/mock-prisma";

async function callPOST(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/qr-orders/route");
  const request = new Request("http://localhost/api/qr-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

async function callGET(restaurantId: string) {
  const { GET } = await import("@/app/api/qr-orders/route");
  const request = new Request(
    `http://localhost/api/qr-orders?restaurantId=${restaurantId}`
  );
  return GET(request);
}

describe("QR Orders API - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaMocks();
  });

  // T15: Rate limiting test - POST 100 QR orders rapidly
  it("T15: POST /api/qr-orders should be rate limited (VULN-07)", async () => {
    // This test documents that the QR orders endpoint has NO rate limiting.
    // In middleware.ts, there's no rate limit check for /api/qr-orders POST.
    // An attacker can flood the endpoint with fake orders.

    mockNoSession();

    mockPrisma.restaurant.findUnique.mockResolvedValue({
      id: "rest_123",
      name: "Test Restaurant",
    });

    mockPrisma.table.findFirst.mockResolvedValue({
      id: "table_1",
      restaurantId: "rest_123",
      tableNumber: "1",
    });

    mockPrisma.qROrder.create.mockResolvedValue({
      id: "qr_123",
      status: "pending_approval",
    });

    // Send 20 rapid requests - all should succeed (no rate limiting)
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        callPOST({
          restaurantId: "rest_123",
          tableId: "table_1",
          tableNumber: "1",
          customerName: "Attacker",
          customerMobile: "1234567890",
          items: [{ id: "item_1", name: "Fake Item", qty: 1, price: 100 }],
          total: 100,
        })
      )
    );

    // CURRENT BEHAVIOR: all 20 succeed with 201 (NO rate limiting)
    const allSucceeded = results.every((r) => r.status === 201);
    expect(allSucceeded).toBe(true); // Demonstrates VULN-07

    // AFTER FIX: later requests should return 429 Too Many Requests
  });

  // T16: GET QR orders without auth - data enumeration
  it("T16: GET /api/qr-orders allows unauthenticated data enumeration (VULN-12)", async () => {
    mockNoSession();

    mockPrisma.qROrder.findMany.mockResolvedValue([
      {
        id: "qr_1",
        restaurantId: "rest_123",
        customerName: "John Doe",
        customerMobile: "9876543210",
        items: [{ name: "Burger", qty: 1, price: 200 }],
        total: 200,
        status: "pending_approval",
      },
    ]);

    mockPrisma.qROrder.count.mockResolvedValue(1);

    const response = await callGET("rest_123");
    const data = await response.json();

    // CURRENT BEHAVIOR: 200 with full order data including customer PII
    // Anyone can enumerate orders for any restaurant without authentication
    expect(response.status).toBe(200);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].customerMobile).toBe("9876543210"); // PII exposed

    // AFTER FIX: Should require authentication or scope to customer's own order
  });
});
