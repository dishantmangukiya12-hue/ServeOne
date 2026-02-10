import { z } from "zod";

// Shared field schemas
const restaurantIdField = z.string().min(1, "restaurantId is required");
const mobileField = z.string().min(10, "Valid mobile number required");
const nameField = z.string().min(1, "Name is required");

// Restaurant
export const createRestaurantSchema = z.object({
  restaurant: z.object({
    id: z.string().min(1),
    name: nameField,
    mobile: mobileField,
    passcode: z.string().min(4, "Passcode must be at least 4 characters"),
    address: z.string().optional(),
    createdAt: z.string().min(1),
  }),
  data: z.record(z.unknown()),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: mobileField.optional(),
  address: z.string().nullable().optional(),
}).refine(data => Object.keys(data).length > 0, { message: "No updates provided" });

export const updatePasscodeSchema = z.object({
  passcode: z.string().min(4, "Passcode must be at least 4 characters"),
});

// Orders
export const createOrderSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().min(1, "tableId is required"),
  customerName: z.string().optional().default("Guest"),
  customerMobile: z.string().optional().default(""),
  adults: z.number().int().min(0).optional().default(1),
  kids: z.number().int().min(0).optional().default(0),
  items: z.array(z.record(z.unknown())).min(1, "At least one item required"),
  channel: z.string().optional().default("dineIn"),
  subTotal: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  total: z.number().min(0).optional().default(0),
  waiterName: z.string().optional(),
});

export const updateOrderSchema = z.object({
  items: z.array(z.record(z.unknown())).optional(),
  status: z.string().optional(),
  paymentMethod: z.string().nullable().optional(),
  subTotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  closedAt: z.string().nullable().optional(),
  auditLog: z.array(z.record(z.unknown())).optional(),
});

// Menu
export const createMenuItemSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  price: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Price must be non-negative")),
  category: z.string().min(1, "Category is required"),
  isVeg: z.boolean().optional().default(true),
  dineIn: z.boolean().optional().default(true),
  takeAway: z.boolean().optional().default(true),
  homeDelivery: z.boolean().optional().default(true),
  aggregators: z.boolean().optional().default(true),
  image: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  modifiers: z.unknown().optional(),
  stockQuantity: z.number().int().nullable().optional(),
  lowStockThreshold: z.number().int().nullable().optional(),
  available: z.boolean().optional().default(true),
});

export const createCategorySchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  icon: z.string().min(1, "Icon is required"),
  sortingOrder: z.number().int().min(0),
});

// Tables
export const createTableSchema = z.object({
  restaurantId: restaurantIdField,
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.number().int().min(1).optional().default(4),
  status: z.string().optional().default("available"),
});

// Customers
export const createCustomerSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  mobile: mobileField,
  email: z.string().email().optional().or(z.literal("")),
  birthDate: z.string().nullable().optional(),
  anniversaryDate: z.string().nullable().optional(),
  preferences: z.string().nullable().optional(),
  loyaltyPoints: z.number().int().min(0).optional().default(0),
  tier: z.string().optional().default("bronze"),
});

// Reservations
export const createReservationSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().nullable().optional(),
  customerName: nameField,
  customerMobile: mobileField,
  partySize: z.number().int().min(1, "Party size must be at least 1"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  status: z.string().optional().default("confirmed"),
  notes: z.string().nullable().optional(),
});

// Expenses
export const createExpenseSchema = z.object({
  restaurantId: restaurantIdField,
  category: z.string().nullable().optional(),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0, "Amount must be non-negative")),
  description: z.string().min(1, "Description is required"),
  date: z.string().min(1, "Date is required"),
  createdBy: z.string().optional().default("System"),
});

// Inventory
export const createInventorySchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  unit: z.string().min(1, "Unit is required"),
  quantity: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)),
  minThreshold: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional().default(10),
  costPerUnit: z.union([z.number(), z.string()]).transform(val => typeof val === "string" ? parseFloat(val) : val).pipe(z.number().min(0)).optional().default(0),
  supplier: z.string().nullable().optional(),
});

// Users
export const createUserSchema = z.object({
  restaurantId: restaurantIdField,
  name: nameField,
  email: z.string().email().optional().or(z.literal("")),
  mobile: mobileField,
  passcode: z.string().min(4, "Passcode must be at least 4 characters"),
  role: z.string().min(1, "Role is required"),
});

// QR Orders
export const createQROrderSchema = z.object({
  restaurantId: restaurantIdField,
  tableId: z.string().min(1),
  tableNumber: z.string().min(1),
  customerName: nameField,
  customerMobile: mobileField,
  items: z.array(z.record(z.unknown())).min(1, "At least one item required"),
  total: z.number().min(0),
});

// Waitlist
export const createWaitlistSchema = z.object({
  restaurantId: restaurantIdField,
  customerName: nameField,
  customerMobile: mobileField,
  partySize: z.number().int().min(1),
  estimatedWait: z.number().int().min(0),
  notes: z.string().nullable().optional(),
});
