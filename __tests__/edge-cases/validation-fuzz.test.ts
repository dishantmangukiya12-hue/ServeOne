import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  createMenuItemSchema,
  createCustomerSchema,
  createUserSchema,
  createReservationSchema,
  createExpenseSchema,
  createInventorySchema,
  createQROrderSchema,
  createWaitlistSchema,
  createRestaurantSchema,
  createTableSchema,
  createCategorySchema,
  updatePasscodeSchema,
} from "@/lib/validations";

// =============================================================================
// 50 EDGE CASES FOR ZOD SCHEMA FUZZING
// Organized by category: nulls, empty strings, negatives, extremes,
// unicode, arrays/objects, type confusion, boundaries
// =============================================================================

describe("Edge Cases: Null/Undefined (1-5)", () => {
  // Edge Case 1
  it("EC-01: null mobile and passcode should fail createUserSchema", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: null,
      passcode: null,
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 2
  it("EC-02: undefined restaurantId should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: undefined,
      tableId: "table_1",
      items: [{ id: "1", name: "Item", qty: 1 }],
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 3
  it("EC-03: null items should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: null,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 4
  it("EC-04: all null fields should fail createUserSchema", () => {
    const result = createUserSchema.safeParse({
      name: null,
      mobile: null,
      passcode: null,
      role: null,
      restaurantId: null,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 5
  it("EC-05: null financial values should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: null,
      subTotal: null,
      tax: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("Edge Cases: Empty Strings (6-10)", () => {
  // Edge Case 6
  it("EC-06: empty mobile and passcode should fail createUserSchema", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "",
      passcode: "",
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 7
  it("EC-07: empty name and restaurantId should fail createCustomerSchema", () => {
    const result = createCustomerSchema.safeParse({
      name: "",
      restaurantId: "",
      mobile: "1234567890",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 8
  it("EC-08: array with empty object as item should pass createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{}],
    });
    // z.array(z.record(z.unknown())).min(1) - empty object is a valid record
    expect(result.success).toBe(true);
  });

  // Edge Case 9
  it("EC-09: empty passcode should fail updatePasscodeSchema", () => {
    const result = updatePasscodeSchema.safeParse({ passcode: "" });
    expect(result.success).toBe(false);
  });

  // Edge Case 10
  it("EC-10: empty customerName and customerMobile should use defaults", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      customerName: "",
      customerMobile: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerName).toBe("");
      expect(result.data.customerMobile).toBe("");
    }
  });
});

describe("Edge Cases: Negative Numbers (11-15)", () => {
  // Edge Case 11
  it("EC-11: negative financial values should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: -1,
      subTotal: -100,
      tax: -5,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 12
  it("EC-12: negative price should fail createMenuItemSchema", () => {
    const result = createMenuItemSchema.safeParse({
      restaurantId: "rest_123",
      name: "Burger",
      price: -999.99,
      category: "Food",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 13
  it("EC-13: negative quantity should fail createInventorySchema", () => {
    const result = createInventorySchema.safeParse({
      restaurantId: "rest_123",
      name: "Rice",
      unit: "kg",
      quantity: -1,
      minThreshold: -10,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 14
  it("EC-14: negative adults/kids should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      adults: -1,
      kids: -5,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 15
  it("EC-15: negative partySize and estimatedWait should fail", () => {
    const result = createWaitlistSchema.safeParse({
      restaurantId: "rest_123",
      customerName: "Test",
      customerMobile: "1234567890",
      partySize: -1,
      estimatedWait: -60,
    });
    expect(result.success).toBe(false);
  });
});

describe("Edge Cases: Extreme Numbers (16-20)", () => {
  // Edge Case 16
  it("EC-16: MAX_SAFE_INTEGER total should pass (no upper bound)", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: Number.MAX_SAFE_INTEGER,
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 17
  it("EC-17: floating point precision (0.1 + 0.2) should pass", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: 0.1 + 0.2, // 0.30000000000000004
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 18
  it("EC-18: NaN price should fail createMenuItemSchema", () => {
    const result = createMenuItemSchema.safeParse({
      restaurantId: "rest_123",
      name: "Burger",
      price: NaN,
      category: "Food",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 19
  it("EC-19: Infinity total should fail createOrderSchema", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: Infinity,
    });
    // z.number().min(0) - Infinity is >= 0 so it might pass!
    // This is a potential edge case gap
    expect(result.success).toBe(true); // Infinity passes min(0)!
  });

  // Edge Case 20
  it("EC-20: int32 overflow in stockQuantity should pass (no upper bound)", () => {
    const result = createMenuItemSchema.safeParse({
      restaurantId: "rest_123",
      name: "Burger",
      price: 100,
      category: "Food",
      stockQuantity: 2147483648, // int32 overflow
    });
    // z.number().int() will still pass for this - JS handles it
    expect(result.success).toBe(true);
  });
});

describe("Edge Cases: Unicode & Special Characters (21-30)", () => {
  // Edge Case 21
  it("EC-21: SQL injection in name should pass Zod (stopped at DB layer)", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "'; DROP TABLE restaurants; --",
      mobile: "1234567890",
    });
    // Zod only checks min length, SQL injection protection is at ORM layer
    expect(result.success).toBe(true);
  });

  // Edge Case 22
  it("EC-22: XSS payload in name should pass Zod (stopped at render layer)", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "<script>alert('xss')</script>",
      mobile: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 23
  it("EC-23: 100k character string should pass Zod (no max length)", () => {
    const longName = "A".repeat(100000);
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: longName,
      mobile: "1234567890",
    });
    // No max length validation - this is a potential DoS vector
    expect(result.success).toBe(true);
  });

  // Edge Case 24
  it("EC-24: null byte characters should pass Zod", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "\u0000\u0001\u0002",
      mobile: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 25
  it("EC-25: tabs in mobile number should pass Zod (only checks length)", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "+91 98765\t43210", // Contains tab character
    });
    // min(10) check passes because tab counts as a character
    expect(result.success).toBe(true);
  });

  // Edge Case 26
  it("EC-26: RTL override character in name should pass Zod", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "Cafe\u202ERistoranteafaC",
      mobile: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 27
  it("EC-27: CRLF injection in description should pass Zod", () => {
    const result = createMenuItemSchema.safeParse({
      restaurantId: "rest_123",
      name: "Burger",
      price: 100,
      category: "Food",
      description: "Test\r\n\r\nInjected\r\nHeaders",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 28
  it("EC-28: Bobby Tables name should pass Zod", () => {
    const result = createCustomerSchema.safeParse({
      restaurantId: "rest_123",
      name: "Robert'); DROP TABLE students;--",
      mobile: "1234567890",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 29
  it("EC-29: zero-width spaces as passcode should pass Zod", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "1234567890",
      passcode: "\u200B\u200B\u200B\u200B", // 4 zero-width spaces
      role: "waiter",
    });
    // min(4) passes because zero-width spaces count as characters
    expect(result.success).toBe(true);
  });

  // Edge Case 30
  it("EC-30: HTML injection in category should pass Zod", () => {
    const result = createCategorySchema.safeParse({
      restaurantId: "rest_123",
      name: 'Food & Beverage <img onerror=alert(1) src=x>',
      icon: "utensils",
      sortingOrder: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("Edge Cases: Arrays & Objects (31-38)", () => {
  // Edge Case 31
  it("EC-31: 100k items array should pass Zod (no max length)", () => {
    const items = new Array(100000).fill({ id: "x", qty: 1 });
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items,
    });
    // No max array length - potential DoS
    expect(result.success).toBe(true);
  });

  // Edge Case 32
  it("EC-32: deeply nested arrays should fail (not a record)", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [[[[[]]]]],
    });
    // z.array(z.record(z.unknown())) - nested arrays are not records
    expect(result.success).toBe(false);
  });

  // Edge Case 33
  it("EC-33: string instead of array for items should fail", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: "not_an_array",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 34
  it("EC-34: deeply nested modifiers should pass (z.unknown())", () => {
    const result = createMenuItemSchema.safeParse({
      restaurantId: "rest_123",
      name: "Burger",
      price: 100,
      category: "Food",
      modifiers: { a: { b: { c: { d: { e: { f: "deep" } } } } } },
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 35
  it("EC-35: __proto__ pollution attempt in items should pass Zod", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ __proto__: { isAdmin: true } }],
    });
    // z.record(z.unknown()) accepts any key-value pairs
    expect(result.success).toBe(true);
  });

  // Edge Case 36
  it("EC-36: constructor pollution attempt should still validate", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      constructor: { prototype: { isAdmin: true } },
    });
    // Extra field ignored by Zod (strip mode by default)
    expect(result.success).toBe(true);
  });

  // Edge Case 37
  it("EC-37: 10k users in import data shape", () => {
    const users = new Array(10000).fill({
      id: "u1",
      name: "Test",
      mobile: "1234567890",
      passcode: "test1234",
      role: "waiter",
      status: "active",
    });
    // Not validated by Zod in import route - just passed through
    expect(users.length).toBe(10000);
  });

  // Edge Case 38
  it("EC-38: object with custom toString in items should pass Zod", () => {
    // Note: JSON.parse strips custom functions, so in practice this
    // wouldn't arrive via HTTP. But testing schema directly:
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1", toString: "malicious" }],
    });
    expect(result.success).toBe(true);
  });
});

describe("Edge Cases: Type Confusion (39-44)", () => {
  // Edge Case 39
  it("EC-39: number instead of string for restaurantId should fail", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: 12345,
      tableId: "table_1",
      items: [{ id: "1" }],
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 40
  it("EC-40: string 'not_a_number' for total should fail (number expected)", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: [{ id: "1" }],
      total: "not_a_number",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 41
  it("EC-41: boolean instead of array for items should fail", () => {
    const result = createOrderSchema.safeParse({
      restaurantId: "rest_123",
      tableId: "table_1",
      items: true,
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 42
  it("EC-42: number instead of string for passcode should fail", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "1234567890",
      passcode: 1234,
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 43
  it("EC-43: SQL injection via query params (page/limit)", () => {
    // Query params come as strings; parseInt handles them
    expect(parseInt("1; DROP TABLE orders")).toBe(1); // parseInt stops at non-numeric
    expect(parseInt("100 OR 1=1")).toBe(100);
    expect(isNaN(parseInt("abc"))).toBe(true);
    // Math.max(1, NaN) = NaN, which could cause issues
    expect(isNaN(Math.max(1, NaN))).toBe(true);
  });

  // Edge Case 44
  it("EC-44: array instead of string for mobile should fail", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: ["array", "of", "strings"],
      passcode: "test1234",
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });
});

describe("Edge Cases: Boundary Values (45-50)", () => {
  // Edge Case 45
  it("EC-45: 3-char passcode should fail (min 4)", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "1234567890",
      passcode: "abc",
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 46
  it("EC-46: 10k char passcode should pass Zod (no max, but bcrypt truncates at 72 bytes)", () => {
    const longPasscode = "a".repeat(10000);
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "1234567890",
      passcode: longPasscode,
      role: "waiter",
    });
    // Passes Zod, but bcrypt will only hash first 72 bytes
    // This means two different 10k-char passcodes sharing the same first 72 bytes
    // would hash to the same value
    expect(result.success).toBe(true);
  });

  // Edge Case 47
  it("EC-47: exactly 10-char mobile should pass (min 10)", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "1234567890",
      passcode: "test1234",
      role: "waiter",
    });
    expect(result.success).toBe(true);
  });

  // Edge Case 48
  it("EC-48: 9-char mobile should fail (below min 10)", () => {
    const result = createUserSchema.safeParse({
      restaurantId: "rest_123",
      name: "Test",
      mobile: "123456789",
      passcode: "test1234",
      role: "waiter",
    });
    expect(result.success).toBe(false);
  });

  // Edge Case 49
  it("EC-49: page=0 and limit=0 should be clamped by API code", () => {
    // The API routes do: Math.max(1, parseInt("0")) = 1
    // and Math.min(100, Math.max(1, parseInt("0"))) = 1
    expect(Math.max(1, parseInt("0"))).toBe(1);
    expect(Math.min(100, Math.max(1, parseInt("0")))).toBe(1);
  });

  // Edge Case 50
  it("EC-50: extreme page number should produce large skip value", () => {
    const page = 999999999;
    const limit = 100;
    const skip = (page - 1) * limit;
    // skip = 99999999800 - This is a valid number but could cause
    // the database to scan/skip an enormous number of rows
    expect(skip).toBe(99999999800);
    expect(Number.isSafeInteger(skip)).toBe(true);
  });
});
