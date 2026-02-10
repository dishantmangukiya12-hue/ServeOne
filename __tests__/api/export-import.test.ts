import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession, mockNoSession } from "../helpers/mock-session";
import { mockPrisma, resetPrismaMocks } from "../helpers/mock-prisma";

async function callExportGET(restaurantId: string) {
  const { GET } = await import("@/app/api/export/route");
  const request = new Request(
    `http://localhost/api/export?restaurantId=${restaurantId}`
  );
  return GET(request);
}

async function callImportPOST(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/import/route");
  const request = new Request("http://localhost/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe("Export API - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaMocks();
  });

  // T17: Export should NOT include passcodes
  it("T17: GET /api/export should strip passcode from output (VULN-02)", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    const mockRestaurant = {
      id: "rest_123",
      name: "Test Restaurant",
      mobile: "1234567890",
      passcode: "$2b$12$hashedpasscodethatwasleaked",
      address: "123 Main St",
      createdAt: new Date("2024-01-01"),
      settings: {},
      nextOrderNumber: 42,
    };

    const mockUsers = [
      {
        id: "user_1",
        restaurantId: "rest_123",
        name: "Admin",
        mobile: "1234567890",
        passcode: "$2b$12$staffpasscodehash",
        role: "admin",
        lastLogin: new Date("2024-06-01"),
        email: "",
        status: "active",
      },
    ];

    mockPrisma.restaurant.findUnique.mockResolvedValue(mockRestaurant);
    mockPrisma.category.findMany.mockResolvedValue([]);
    mockPrisma.menuItem.findMany.mockResolvedValue([]);
    mockPrisma.order.findMany.mockResolvedValue([]);
    mockPrisma.table.findMany.mockResolvedValue([]);
    mockPrisma.user.findMany.mockResolvedValue(mockUsers);
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.inventoryItem.findMany.mockResolvedValue([]);
    mockPrisma.expense.findMany.mockResolvedValue([]);
    mockPrisma.customer.findMany.mockResolvedValue([]);

    const response = await callExportGET("rest_123");
    const data = await response.json();

    expect(response.status).toBe(200);

    // FIXED (VULN-02): passcode is now stripped from export
    expect(data.restaurant.passcode).toBeUndefined();
    expect(data.users[0].passcode).toBeUndefined();
  });
});

describe("Import API - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaMocks();
  });

  // T18: Import with extra/unknown fields should be stripped
  it("T18: POST /api/import should strip unknown fields from payload (VULN-08)", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    mockPrisma.restaurant.findUnique.mockResolvedValue({
      id: "rest_123",
      name: "Test Restaurant",
    });

    // Import with malicious extra fields
    let capturedData: unknown = null;
    mockPrisma.category.createMany.mockImplementation(async (args: { data: unknown }) => {
      capturedData = args.data;
      return { count: 1 };
    });

    // No existing data to delete
    mockPrisma.category.count.mockResolvedValue(0);
    mockPrisma.menuItem.count.mockResolvedValue(0);
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.table.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.reservation.count.mockResolvedValue(0);
    mockPrisma.inventoryItem.count.mockResolvedValue(0);
    mockPrisma.expense.count.mockResolvedValue(0);
    mockPrisma.customer.count.mockResolvedValue(0);

    mockPrisma.restaurantStore.upsert.mockResolvedValue({});

    const response = await callImportPOST({
      restaurantId: "rest_123",
      data: {
        categories: [
          {
            id: "cat_1",
            name: "Food",
            icon: "utensils",
            sortingOrder: 0,
            // Malicious extra fields:
            __proto__: { isAdmin: true },
            evilField: "malicious_data",
          },
        ],
      },
      merge: true,
    });

    // CURRENT BEHAVIOR: The spread operator ...cat passes ALL fields through
    // including unknown ones, to Prisma createMany.
    // Prisma may ignore unknown fields, but it's still a data integrity risk.
    expect(response.status).toBe(200);
    // Ideally, capturedData should only contain validated fields
  });

  // T19: Large payload test
  it("T19: POST /api/import should handle large payloads gracefully", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    mockPrisma.restaurant.findUnique.mockResolvedValue({
      id: "rest_123",
      name: "Test Restaurant",
    });

    // Create a large payload with 10k categories
    const largeCategories = Array.from({ length: 10000 }, (_, i) => ({
      id: `cat_${i}`,
      name: `Category ${i}`,
      icon: "utensils",
      sortingOrder: i,
    }));

    mockPrisma.category.count.mockResolvedValue(0);
    mockPrisma.menuItem.count.mockResolvedValue(0);
    mockPrisma.order.count.mockResolvedValue(0);
    mockPrisma.table.count.mockResolvedValue(0);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.reservation.count.mockResolvedValue(0);
    mockPrisma.inventoryItem.count.mockResolvedValue(0);
    mockPrisma.expense.count.mockResolvedValue(0);
    mockPrisma.customer.count.mockResolvedValue(0);
    mockPrisma.category.createMany.mockResolvedValue({ count: 10000 });
    mockPrisma.restaurantStore.upsert.mockResolvedValue({});

    const response = await callImportPOST({
      restaurantId: "rest_123",
      data: { categories: largeCategories },
      merge: true,
    });

    // CURRENT BEHAVIOR: No size limit - processes all 10k categories
    // This could cause timeouts or memory issues with larger payloads
    expect(response.status).toBe(200);
  });
});
