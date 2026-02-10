import { vi } from "vitest";
import { getServerSession } from "next-auth";

/**
 * Mock an authenticated session for testing
 */
export function mockSession(overrides: {
  restaurantId?: string;
  role?: string;
  userId?: string;
  name?: string;
  type?: string;
} = {}) {
  const session = {
    user: {
      id: overrides.restaurantId || "rest_123",
      name: overrides.name || "Test User",
      role: overrides.role || "admin",
      restaurantId: overrides.restaurantId || "rest_123",
      userId: overrides.userId || "user_123",
      type: overrides.type || "restaurant",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(session);
  return session;
}

/**
 * Mock an unauthenticated session (no login)
 */
export function mockNoSession() {
  (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
}

/**
 * Mock a staff session (waiter, cashier, etc.)
 */
export function mockStaffSession(role: string = "waiter", restaurantId: string = "rest_123") {
  return mockSession({
    restaurantId,
    role,
    userId: "staff_456",
    name: "Staff User",
    type: "staff",
  });
}
