// Domain types for the restaurant management platform
// Extracted from services/dataService.ts — this is the single source of truth for types

export interface Restaurant {
  id: string;
  name: string;
  mobile: string;
  passcode: string;
  address: string;
  createdAt: string;
  plan?: string;
  planExpiresAt?: string;
  trialEndsAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  isVeg: boolean;
  dineIn: boolean;
  takeAway: boolean;
  homeDelivery: boolean;
  aggregators: boolean;
  image?: string;
  description?: string;
  modifiers?: ModifierGroup[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  available?: boolean;
  recipeIngredients?: {
    inventoryItemId: string;
    quantity: number;
    name?: string;
  }[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortingOrder: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest: string;
  addedAt?: string;
  modifiers?: SelectedModifier[];
  status?: "pending" | "preparing" | "ready" | "served";
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  options: ModifierOption[];
}

export type OrderChannel =
  | "dineIn"
  | "takeAway"
  | "homeDelivery"
  | "swiggy"
  | "zomato"
  | "other";

export type OrderStatus =
  | "active"
  | "preparing"
  | "ready"
  | "served"
  | "closed"
  | "cancelled"
  | "pending_payment";

export interface Order {
  id: string;
  restaurantId: string;
  tableId: string;
  customerName: string;
  customerMobile: string;
  adults: number;
  kids: number;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: string;
  subTotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  closedAt?: string;
  waiterName: string;
  orderNumber: number;
  channel: OrderChannel;
  auditLog: AuditEntry[];
  partialPayments?: { method: string; amount: number; paidAt: string }[];
  amountPaid?: number;
  amountDue?: number;
  consolidatedOrders?: { orderNumber: number; createdAt: string }[];
  inventoryDeducted?: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
}

export interface Table {
  id: string;
  restaurantId: string;
  tableNumber: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  currentOrderId?: string;
  mergedWith?: string[];
  section?: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  tableId?: string;
  customerName: string;
  customerMobile: string;
  partySize: number;
  date: string;
  time: string;
  status: "confirmed" | "seated" | "cancelled" | "noShow";
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  mobile: string;
  passcode: string;
  role: "admin" | "manager" | "waiter" | "cashier" | "kitchen";
  status: "active" | "inactive";
  lastLogin?: string;
}

export interface StaffAttendance {
  id: string;
  userId: string;
  restaurantId?: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: "present" | "absent" | "halfDay";
}

export interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
}

export interface Expense {
  id: string;
  restaurantId: string;
  category?: string;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  paymentMethod?: "cash" | "upi" | "card" | "online" | "cheque";
  vendorName?: string;
  receiptNumber?: string;
  notes?: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
}

export interface Customer {
  id: string;
  restaurantId: string;
  name: string;
  mobile: string;
  email?: string;
  birthDate?: string;
  anniversaryDate?: string;
  visits: number;
  totalSpent: number;
  lastVisit?: string;
  preferences?: string[];
  loyaltyPoints: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface RestaurantSettings {
  taxRate: number;
  serviceCharge: number;
  currency: string;
  enableLoyalty: boolean;
  loyaltyPointsPerRupee: number;
  enableInventory: boolean;
  tax?: {
    cgst: number;
    sgst: number;
    serviceCharge: number;
  };
  receipt?: {
    header: string;
    footer: string;
    gstNumber: string;
    showGstNumber: boolean;
  };
  notifications?: {
    newOrder: boolean;
    orderCancel: boolean;
    payment: boolean;
    lowStock: boolean;
    dailySummary: boolean;
  };
  payments?: {
    cash: boolean;
    upi: boolean;
    card: boolean;
    online: boolean;
  };
  printers?: Printer[];
  setupComplete?: boolean;
}

export interface Printer {
  id: string;
  restaurantId: string;
  name: string;
  type: "bill" | "kitchen" | "both";
  paperSize: "58mm" | "80mm" | "a4";
  isDefault: boolean;
  isActive: boolean;
}

export interface QROrder {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerMobile: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  channel?: string;
}

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  customerName: string;
  customerMobile: string;
  partySize: number;
  addedAt: string;
  estimatedWait: number;
  status: string;
  notes?: string;
}

// Legacy type kept for backward compatibility during migration
export interface RestaurantData {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  orders: Order[];
  tables: Table[];
  users: User[];
  reservations: Reservation[];
  inventory: InventoryItem[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  customers: Customer[];
  attendance: StaffAttendance[];
  settings: RestaurantSettings;
  printers: Printer[];
  nextOrderNumber: number;
}

// API response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// SSE invalidation event entities
export type InvalidationEntity =
  | "orders"
  | "menu-items"
  | "categories"
  | "tables"
  | "inventory"
  | "expenses"
  | "customers"
  | "reservations"
  | "users"
  | "qr-orders"
  | "waitlist"
  | "restaurant"
  | "attendance";
