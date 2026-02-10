import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSession, mockStaffSession, mockNoSession } from "../helpers/mock-session";
import { mockPrisma, resetPrismaMocks } from "../helpers/mock-prisma";

// We test the API route handlers by importing them directly
// The route handlers are async functions that take Request objects

async function callPUT(id: string, body: Record<string, unknown>) {
  const { PUT } = await import("@/app/api/users/[id]/route");
  const request = new Request(`http://localhost/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return PUT(request, { params: Promise.resolve({ id }) });
}

async function callPOST(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/users/route");
  const request = new Request("http://localhost/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(request);
}

async function callDELETE(id: string) {
  const { DELETE } = await import("@/app/api/users/[id]/route");
  const request = new Request(`http://localhost/api/users/${id}`, {
    method: "DELETE",
  });
  return DELETE(request, { params: Promise.resolve({ id }) });
}

describe("Users API - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    resetPrismaMocks();
  });

  // T06: Privilege escalation via PUT - waiter sets own role to admin
  it("T06: PUT should BLOCK role escalation from waiter to admin (VULN-03)", async () => {
    mockStaffSession("waiter", "rest_123");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "staff_456",
      restaurantId: "rest_123",
      name: "Waiter",
      role: "waiter",
      mobile: "1234567890",
      passcode: "$2b$12$hashedvalue",
      status: "active",
    });

    mockPrisma.user.update.mockResolvedValue({
      id: "staff_456",
      role: "admin", // The update should NOT allow this
    });

    const response = await callPUT("staff_456", { role: "admin" });
    const data = await response.json();

    // FIXED (VULN-03): Waiter cannot escalate to admin - returns 403
    expect(response.status).toBe(403);
    expect(data.error).toBe("Only admins can change user roles");
  });

  // T07: Passcode stored without hashing on PUT update
  it("T07: PUT should hash passcode before storing (VULN-04)", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user_789",
      restaurantId: "rest_123",
      name: "Staff",
      role: "waiter",
      mobile: "1234567890",
      passcode: "$2b$12$oldhash",
      status: "active",
    });

    let capturedUpdateData: Record<string, unknown> = {};
    mockPrisma.user.update.mockImplementation(async (args: { data: Record<string, unknown> }) => {
      capturedUpdateData = args.data;
      return { id: "user_789", ...args.data };
    });

    await callPUT("user_789", { passcode: "newpassword123" });

    // FIXED (VULN-04): Passcode is now hashed with bcrypt
    const storedPasscode = capturedUpdateData.passcode as string;
    const isBcryptHash =
      typeof storedPasscode === "string" &&
      (storedPasscode.startsWith("$2a$") || storedPasscode.startsWith("$2b$"));

    expect(isBcryptHash).toBe(true);
  });

  // T08: POST with invalid role should be rejected
  it("T08: POST should reject invalid role 'superadmin'", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    // Mock checkPlanLimit to allow
    vi.doMock("@/lib/plan-check", () => ({
      checkPlanLimit: vi.fn().mockResolvedValue({ allowed: true }),
    }));

    mockPrisma.user.findFirst.mockResolvedValue(null); // No existing user

    const response = await callPOST({
      restaurantId: "rest_123",
      name: "Hacker",
      mobile: "9999999999",
      passcode: "test1234",
      role: "superadmin",
    });

    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid role");
  });

  // T09: DELETE from non-admin session - should be blocked
  it("T09: DELETE should BLOCK non-admin users from deleting others (VULN-09)", async () => {
    mockStaffSession("waiter", "rest_123");

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "other_user",
      restaurantId: "rest_123",
      name: "Other Staff",
      role: "cashier",
    });

    mockPrisma.user.update.mockResolvedValue({ id: "other_user", deletedAt: new Date() });

    const response = await callDELETE("other_user");
    const data = await response.json();

    // FIXED (VULN-09): Waiter cannot delete users - returns 403
    expect(response.status).toBe(403);
    expect(data.error).toBe("Only admins and managers can delete users");
  });

  // T10: POST with mobile from different restaurant - should succeed
  it("T10: POST should allow same mobile in different restaurants", async () => {
    mockSession({ restaurantId: "rest_123", role: "admin" });

    vi.doMock("@/lib/plan-check", () => ({
      checkPlanLimit: vi.fn().mockResolvedValue({ allowed: true }),
    }));

    // findFirst checks within same restaurant - returns null (not found)
    mockPrisma.user.findFirst.mockResolvedValue(null);

    mockPrisma.user.create.mockResolvedValue({
      id: "user_new",
      restaurantId: "rest_123",
      name: "Staff",
      mobile: "1234567890",
      role: "waiter",
      status: "active",
    });

    const response = await callPOST({
      restaurantId: "rest_123",
      name: "Staff",
      mobile: "1234567890", // This mobile exists in rest_456 but not rest_123
      passcode: "test1234",
      role: "waiter",
    });

    expect(response.status).toBe(201);
  });
});
