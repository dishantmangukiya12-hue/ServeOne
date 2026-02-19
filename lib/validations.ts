import { z } from "zod";

// Shared field schemas
const restaurantIdField = z.string().min(1, "restaurantId is required").max(100);
const mobileField = z.string().min(10, "Valid mobile number required").max(15);
const nameField = z.string().min(1, "Name is required").max(200);

// SEC: Proper order item shape instead of z.record(z.unknown())
const orderItemSchema = z.object({
  menuItemId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(999),
  modifiers: z.array(z.object({
    name: z.string().max(200),
    price: z.number().min(0).optional(),
  })).max(50).optional(),
  notes: z.string().max(500).optional(),
  isVeg: z.boolean().optional(),
  category: z.string().max(100).optional(),
}).passthrough(); // Allow extra fields for backward compat

// Restaurant
export const createRestaurantSchema = z.object({
  restaurant: z.object({
    id: z.string().min(1).max(100),
    name: nameField,
    mobile: mobileField,
    passcode: z.string().min(4, "Passcode must be at least 4 characters").max(128),
    address: z.string().max(500).optional(),
    createdAt: z.string().min(1).max(50),
  }),
  data: z.record(z.unknown()),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  mobile: mobileField.optional(),
  address: z.string().max(500).nullable().optional(),
  settings: z.record(z.unknown()).optional(),
}).refine(data => Object.keys(data).length > 0, { message: "No updates provided" });

export const updatePasscodeSchema = z.object({
  passcode: z.string().min(4, "Passcode must be at least 4 characters").max(128, "Passcode must be at most 128 characters"),
});

// Orders
export const createOrderSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().min(1, "tableId is required"),
  customerName: z.string().optional().default("Guest"),
  customerMobile: z.string().max(15).optional().default(""),
  adults: z.number().int().min(0).max(99).optional().default(1),
  kids: z.number().int().min(0).max(99).optional().default(0),
  items: z.array(orderItemSchema).min(1, "At least one item required").max(200),
  channel: z.enum(["dineIn", "takeAway", "homeDelivery", "aggregator"]).optional().default("dineIn"),
  subTotal: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  total: z.number().min(0).optional().default(0),
  waiterName: z.string().max(200).optional(),
});

export const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).max(200).optional(),
  status: z.enum(["active", "completed", "cancelled", "pending"]).optional(),
  paymentMethod: z.string().max(50).nullable().optional(),
  subTotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  closedAt: z.string().max(50).nullable().optional(),
  auditLog: z.array(z.record(z.unknown())).max(500).optional(),
  tableId: z.string().min(1).max(200).optional(),
});

// Menu
export const createMenuItemSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  price: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Price must be non-negative")),
  category: z.string().min(1, "Category is required").max(100),
  isVeg: z.boolean().optional().default(true),
  dineIn: z.boolean().optional().default(true),
  takeAway: z.boolean().optional().default(true),
  homeDelivery: z.boolean().optional().default(true),
  aggregators: z.boolean().optional().default(true),
  image: z.string().max(2000).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  modifiers: z.array(z.object({
    name: z.string().max(200),
    price: z.number().min(0).optional(),
    options: z.array(z.object({
      name: z.string().max(200),
      price: z.number().min(0).optional(),
    })).max(50).optional(),
  })).max(20).nullable().optional(),
  stockQuantity: z.number().int().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
  available: z.boolean().optional().default(true),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Price must be non-negative")).optional(),
  category: z.string().min(1).max(100).optional(),
  isVeg: z.boolean().optional(),
  dineIn: z.boolean().optional(),
  takeAway: z.boolean().optional(),
  homeDelivery: z.boolean().optional(),
  aggregators: z.boolean().optional(),
  image: z.string().max(2000).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  modifiers: z.array(z.object({
    name: z.string().max(200),
    price: z.number().min(0).optional(),
    options: z.array(z.object({
      name: z.string().max(200),
      price: z.number().min(0).optional(),
    })).max(50).optional(),
  })).max(20).nullable().optional(),
  stockQuantity: z.number().int().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
  available: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  icon: z.string().min(1, "Icon is required").max(100),
  sortingOrder: z.number().int().min(0).max(9999),
});

// Tables
export const createTableSchema = z.object({
  restaurantId: restaurantIdField,
  tableNumber: z.string().min(1, "Table number is required").max(50),
  capacity: z.number().int().min(1).max(100).optional().default(4),
  status: z.enum(["available", "occupied", "reserved"]).optional().default("available"),
});

export const updateTableSchema = z.object({
  tableNumber: z.string().min(1).max(50).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  status: z.enum(["available", "occupied", "reserved"]).optional(),
  currentOrderId: z.string().nullable().optional(),
  mergedWith: z.string().nullable().optional(),
});

// Customers
export const createCustomerSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  mobile: mobileField,
  email: z.string().email().max(254).optional().or(z.literal("")),
  birthDate: z.string().max(50).nullable().optional(),
  anniversaryDate: z.string().max(50).nullable().optional(),
  preferences: z.string().max(1000).nullable().optional(),
  loyaltyPoints: z.number().int().min(0).optional().default(0),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]).optional().default("bronze"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  mobile: mobileField.optional(),
  email: z.string().email().max(254).optional().or(z.literal("")),
  birthDate: z.string().max(50).nullable().optional(),
  anniversaryDate: z.string().max(50).nullable().optional(),
  preferences: z.string().max(1000).nullable().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  tier: z.enum(["bronze", "silver", "gold", "platinum"]).optional(),
  visits: z.number().int().min(0).optional(),
  totalSpent: z.number().min(0).optional(),
});

// Reservations
export const createReservationSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().nullable().optional(),
  customerName: nameField,
  customerMobile: mobileField,
  partySize: z.number().int().min(1, "Party size must be at least 1").max(100),
  date: z.string().min(1, "Date is required").max(50),
  time: z.string().min(1, "Time is required").max(20),
  status: z.enum(["confirmed", "pending", "cancelled", "seated", "no-show"]).optional().default("confirmed"),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateReservationSchema = z.object({
  tableId: z.string().nullable().optional(),
  customerName: z.string().min(1).max(200).optional(),
  customerMobile: mobileField.optional(),
  partySize: z.number().int().min(1).max(100).optional(),
  date: z.string().min(1).max(50).optional(),
  time: z.string().min(1).max(20).optional(),
  status: z.enum(["confirmed", "pending", "cancelled", "seated", "no-show"]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// Expenses
export const createExpenseSchema = z.object({
  restaurantId: restaurantIdField,
  category: z.string().max(200).nullable().optional(),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Amount must be non-negative")),
  description: z.string().min(1, "Description is required").max(500),
  date: z.string().min(1, "Date is required").max(50),
  createdBy: z.string().max(200).optional().default("System"),
});

export const updateExpenseSchema = z.object({
  category: z.string().max(200).nullable().optional(),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Amount must be non-negative")).optional(),
  description: z.string().min(1).max(500).optional(),
  date: z.string().min(1).max(50).optional(),
  paymentMethod: z.string().max(100).nullable().optional(),
  vendor: z.string().max(200).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  receiptUrl: z.string().max(2000).nullable().optional(),
});

// Inventory
export const createInventorySchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  unit: z.string().min(1, "Unit is required").max(50),
  quantity: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)),
  minThreshold: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional().default(10),
  costPerUnit: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional().default(0),
  supplier: z.string().max(200).nullable().optional(),
});

export const updateInventorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  unit: z.string().min(1).max(50).optional(),
  quantity: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional(),
  minThreshold: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional(),
  costPerUnit: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional(),
  supplier: z.string().max(200).nullable().optional(),
  lastRestocked: z.string().max(50).nullable().optional(),
});

// Users
export const createUserSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  email: z.string().email().max(254).optional().or(z.literal("")),
  mobile: mobileField,
  passcode: z.string().min(4, "Passcode must be at least 4 characters").max(128),
  role: z.enum(["admin", "manager", "waiter", "chef", "cashier"]),
});

// QR Orders
export const createQROrderSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().min(1).max(100),
  tableNumber: z.string().min(1).max(50),
  customerName: nameField,
  customerMobile: mobileField,
  items: z.array(orderItemSchema).min(1, "At least one item required").max(200),
  total: z.number().min(0),
});

// Waitlist
export const createWaitlistSchema = z.object({
  restaurantId: restaurantIdField,
  customerName: nameField,
  customerMobile: mobileField,
  partySize: z.number().int().min(1).max(100),
  estimatedWait: z.number().int().min(0).max(600),
  notes: z.string().max(1000).nullable().optional(),
});

export const updateWaitlistSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerMobile: mobileField.optional(),
  partySize: z.number().int().min(1).max(100).optional(),
  estimatedWait: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(["waiting", "notified", "seated", "left"]).optional(),
});

// Attendance
export const createAttendanceSchema = z.object({
  restaurantId: restaurantIdField,
  userId: z.string().min(1).max(100),
  date: z.string().max(50).optional(),
});
