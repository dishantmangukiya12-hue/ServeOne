import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

describe("Billing - Security Tests", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // T20: Verify endpoint accepts client-supplied planId
  it("T20: POST /api/billing/verify should verify planId server-side (VULN-20)", async () => {
    // The verify endpoint trusts the planId from the client body.
    // An attacker could pay for "pro" but send planId: "enterprise"

    // Set up env vars for the test
    vi.stubEnv("RAZORPAY_KEY_SECRET", "test_secret_key");

    const { mockPrisma, resetPrismaMocks } = await import(
      "../helpers/mock-prisma"
    );
    const { mockSession } = await import("../helpers/mock-session");
    resetPrismaMocks();
    mockSession({ restaurantId: "rest_123", role: "admin" });

    // Generate a valid signature for the test
    const paymentId = "pay_test123";
    const subscriptionId = "sub_test123";
    const secret = "test_secret_key";
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    mockPrisma.restaurant.update.mockResolvedValue({
      id: "rest_123",
      plan: "enterprise",
    });

    const { POST } = await import("@/app/api/billing/verify/route");
    const request = new Request("http://localhost/api/billing/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_subscription_id: subscriptionId,
        razorpay_signature: validSignature,
        planId: "enterprise", // Client claims enterprise even if they paid for pro
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // CURRENT BEHAVIOR: 200 - accepts the client-supplied planId without
    // verifying against the actual Razorpay subscription plan
    expect(response.status).toBe(200);
    expect(data.plan).toBe("enterprise"); // Client got enterprise plan

    // AFTER FIX: The server should look up the plan from Razorpay API
    // and ignore the client-supplied planId

    vi.unstubAllEnvs();
  });

  // Bonus: Test timing-safe comparison for webhook signatures
  it("VULN-06: Webhook signature uses non-constant-time comparison", async () => {
    // The current code does: return expectedSignature === signature
    // This is vulnerable to timing attacks

    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret_123");

    const { verifyWebhookSignature } = await import("@/lib/razorpay");

    const body = '{"event":"test"}';
    const correctSignature = crypto
      .createHmac("sha256", "webhook_secret_123")
      .update(body)
      .digest("hex");

    // Correct signature should pass
    expect(verifyWebhookSignature(body, correctSignature)).toBe(true);

    // Incorrect signature should fail
    expect(verifyWebhookSignature(body, "wrong_signature")).toBe(false);

    // The vulnerability is that === comparison leaks timing information
    // even though the results are correct. After fix, use crypto.timingSafeEqual.

    vi.unstubAllEnvs();
  });
});
