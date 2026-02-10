"use client";

// Data Service for persistent storage using localStorage
// This ensures data is saved locally and accessible even after months

import { toast } from "sonner";

const STORAGE_KEY = 'menew_restaurant_data';
const AUTH_KEY = 'menew_auth';

export interface Restaurant {
  id: string;
  name: string;
  mobile: string;
  passcode: string;
  address: string;
  createdAt: string;
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
  stockQuantity?: number; // For inventory
  lowStockThreshold?: number; // When to show low stock warning
  available?: boolean;
  // Recipe / Bill of Materials - multiple inventory items with quantities
  recipeIngredients?: {
    inventoryItemId: string;
    quantity: number;
    name?: string; // cached name for display
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
  status?: 'pending' | 'preparing' | 'ready' | 'served';
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  options: ModifierOption[];
}

export type OrderChannel = 'dineIn' | 'takeAway' | 'homeDelivery' | 'swiggy' | 'zomato' | 'other';
export type OrderStatus = 'active' | 'preparing' | 'ready' | 'served' | 'closed' | 'cancelled' | 'pending_payment';

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
  // Partial payments for Pay Later
  partialPayments?: { method: string; amount: number; paidAt: string }[];
  amountPaid?: number;
  amountDue?: number;
  // Track consolidated orders info
  consolidatedOrders?: { orderNumber: number; createdAt: string }[];
  // Track if inventory has been deducted for this order
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
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
  mergedWith?: string[]; // IDs of merged tables
  section?: string; // e.g. 'Indoor', 'Outdoor', 'Bar', 'Private'
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
  status: 'confirmed' | 'seated' | 'cancelled' | 'noShow';
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
  role: 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen';
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface StaffAttendance {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'halfDay';
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
  category?: string; // Now supports custom categories
  amount: number;
  description: string;
  date: string;
  createdBy: string;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'online' | 'cheque';
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
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  setupComplete?: boolean;
}

export interface Printer {
  id: string;
  restaurantId: string;
  name: string;
  type: 'bill' | 'kitchen' | 'both';
  paperSize: '58mm' | '80mm' | 'a4';
  isDefault: boolean;
  isActive: boolean;
}

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

interface AllData {
  [restaurantId: string]: RestaurantData;
}

// Initialize with default data if none exists
const initializeData = (): AllData => {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return JSON.parse(existing);
  }
  return {};
};

// Save all data
const saveData = (data: AllData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const saveRestaurantDataLocal = (restaurantId: string, restaurantData: RestaurantData) => {
  const data = initializeData();
  data[restaurantId] = restaurantData;
  saveData(data);
};

const syncRestaurantData = async (restaurantId: string, restaurantData: RestaurantData) => {
  try {
    await fetch(`/api/restaurant-store/${restaurantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: restaurantData }),
    });
  } catch {
    // Ignore sync errors (offline/local only)
  }
};

export const registerRestaurantRemote = async (restaurant: Restaurant, data: RestaurantData) => {
  try {
    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant, data }),
    });
  } catch {
    // Ignore remote sync errors
  }
};

export const updateRestaurantRemote = async (
  restaurantId: string,
  payload: { name?: string; mobile?: string; address?: string; settings?: RestaurantSettings }
) => {
  try {
    await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore remote sync errors
  }
};

export const updateRestaurantPasscodeRemote = async (restaurantId: string, passcode: string) => {
  try {
    await fetch(`/api/restaurants/${restaurantId}/passcode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
  } catch {
    // Ignore remote sync errors
  }
};

export const hydrateRestaurantData = async (restaurantId: string): Promise<RestaurantData | null> => {
  try {
    const response = await fetch(`/api/restaurant-store/${restaurantId}`);
    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.data) return null;
    saveRestaurantDataLocal(restaurantId, payload.data);
    return payload.data as RestaurantData;
  } catch {
    return null;
  }
};

// Get restaurant data
export const getRestaurantData = (restaurantId: string): RestaurantData | null => {
  const data = initializeData();
  const restaurantData = data[restaurantId] || null;
  
  // Migration: Initialize expenseCategories if it doesn't exist
  if (restaurantData && !restaurantData.expenseCategories) {
    restaurantData.expenseCategories = [
      { id: 'exp_cat_ingredients', name: 'Ingredients', color: '#10b981' },
      { id: 'exp_cat_utilities', name: 'Utilities', color: '#f59e0b' },
      { id: 'exp_cat_rent', name: 'Rent', color: '#8b5cf6' },
      { id: 'exp_cat_salary', name: 'Salary', color: '#3b82f6' },
      { id: 'exp_cat_maintenance', name: 'Maintenance', color: '#ef4444' },
      { id: 'exp_cat_marketing', name: 'Marketing', color: '#ec4899' },
      { id: 'exp_cat_equipment', name: 'Equipment', color: '#06b6d4' },
      { id: 'exp_cat_other', name: 'Other', color: '#6b7280' }
    ];
    saveRestaurantData(restaurantId, restaurantData);
  }
  
  return restaurantData;
};

// Save restaurant data
export const saveRestaurantData = (restaurantId: string, restaurantData: RestaurantData) => {
  saveRestaurantDataLocal(restaurantId, restaurantData);
  void syncRestaurantData(restaurantId, restaurantData);
};

// Generate next order number
export const getNextOrderNumber = (restaurantId: string): number => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const nextNum = data.nextOrderNumber || 1;
    data.nextOrderNumber = nextNum + 1;
    saveRestaurantData(restaurantId, data);
    return nextNum;
  }
  return 1;
};

// Create new restaurant
export const createRestaurant = (restaurant: Restaurant): Restaurant => {
  const data = initializeData();
  const defaultPasscode = restaurant.passcode;
  
  data[restaurant.id] = {
    restaurant,
    categories: [],
    menuItems: [],
    orders: [],
    tables: generateDefaultTables(restaurant.id),
    users: [{
      id: `user_${Date.now()}`,
      restaurantId: restaurant.id,
      name: 'Admin',
      email: '',
      mobile: restaurant.mobile,
      passcode: defaultPasscode,
      role: 'admin',
      status: 'active'
    }],
    reservations: [],
    inventory: [],
    expenses: [],
    expenseCategories: [
      { id: 'exp_cat_ingredients', name: 'Ingredients', color: '#10b981' },
      { id: 'exp_cat_utilities', name: 'Utilities', color: '#f59e0b' },
      { id: 'exp_cat_rent', name: 'Rent', color: '#8b5cf6' },
      { id: 'exp_cat_salary', name: 'Salary', color: '#3b82f6' },
      { id: 'exp_cat_maintenance', name: 'Maintenance', color: '#ef4444' },
      { id: 'exp_cat_marketing', name: 'Marketing', color: '#ec4899' },
      { id: 'exp_cat_equipment', name: 'Equipment', color: '#06b6d4' },
      { id: 'exp_cat_other', name: 'Other', color: '#6b7280' }
    ],
    customers: [],
    attendance: [],
    settings: {
      taxRate: 5,
      serviceCharge: 0,
      currency: '₹',
      enableLoyalty: true,
      loyaltyPointsPerRupee: 1,
      enableInventory: false
    },
    printers: [],
    nextOrderNumber: 1
  };
  const restaurantData = data[restaurant.id];
  saveRestaurantDataLocal(restaurant.id, restaurantData);
  void syncRestaurantData(restaurant.id, restaurantData);
  return restaurant;
};

// Generate default tables
const generateDefaultTables = (restaurantId: string): Table[] => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `table_${restaurantId}_${i + 1}`,
    restaurantId,
    tableNumber: String(i + 1).padStart(2, '0'),
    capacity: 4,
    status: 'available'
  }));
};

// Authentication
export const login = (mobile: string, passcode: string): Restaurant | null => {
  const data = initializeData();
  for (const restaurantId in data) {
    const restaurant = data[restaurantId].restaurant;
    // Check restaurant login
    if (restaurant.mobile === mobile && restaurant.passcode === passcode) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ restaurantId, loginTime: Date.now(), role: 'admin' }));
      return restaurant;
    }
    // Check staff login
    const user = data[restaurantId].users.find(u => u.mobile === mobile && u.passcode === passcode && u.status === 'active');
    if (user) {
      user.lastLogin = new Date().toISOString();
      saveRestaurantData(restaurantId, data[restaurantId]);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ 
        restaurantId, 
        userId: user.id,
        loginTime: Date.now(), 
        role: user.role 
      }));
      return restaurant;
    }
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const getCurrentUser = (): { restaurantId: string; userId?: string; role?: string } | null => {
  const auth = localStorage.getItem(AUTH_KEY);
  if (auth) {
    return JSON.parse(auth);
  }
  return null;
};

export const setCurrentUser = (payload: { restaurantId: string; userId?: string; role?: string }) => {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      ...payload,
      loginTime: Date.now(),
    })
  );
};

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Password reset - generate OTP
export const generateResetOTP = (mobile: string): string | null => {
  const data = initializeData();
  for (const restaurantId in data) {
    const restaurant = data[restaurantId].restaurant;
    if (restaurant.mobile === mobile) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP with expiry (5 minutes)
      localStorage.setItem(`reset_otp_${mobile}`, JSON.stringify({
        otp,
        expiry: Date.now() + 5 * 60 * 1000,
        restaurantId
      }));
      return otp; // In production, send via SMS
    }
  }
  return null;
};

// Verify OTP and reset password
export const verifyOTPAndReset = (mobile: string, otp: string, newPasscode: string): boolean => {
  const stored = localStorage.getItem(`reset_otp_${mobile}`);
  if (!stored) return false;
  
  const { otp: storedOTP, expiry, restaurantId } = JSON.parse(stored);
  if (Date.now() > expiry) {
    localStorage.removeItem(`reset_otp_${mobile}`);
    return false;
  }
  
  if (storedOTP !== otp) return false;
  
  // Reset password
  const data = getRestaurantData(restaurantId);
  if (data) {
    // Don't store plain text - the remote API will hash it
    // Just update the remote, and force re-login so the hashed version is used
    void updateRestaurantPasscodeRemote(restaurantId, newPasscode);
    localStorage.removeItem(`reset_otp_${mobile}`);
    return true;
  }
  return false;
};

// Check and notify for low stock
const checkAndNotifyLowStock = (
  restaurantId: string,
  menuItem: MenuItem,
  data: RestaurantData
) => {
  if (!data.settings.enableInventory) return;
  
  const threshold = menuItem.lowStockThreshold ?? 10; // Default threshold of 10
  const currentStock = menuItem.stockQuantity ?? 0;
  
  // Check if stock is at or below threshold
  if (currentStock <= threshold && currentStock > 0) {
    toast.warning(`Low stock alert: "${menuItem.name}" has only ${currentStock} units left!`, {
      duration: 5000,
      style: { background: '#92400e', color: '#fff', border: '1px solid #b45309' }
    });
  } else if (currentStock === 0) {
    toast.error(`Out of stock: "${menuItem.name}" is now out of stock!`, {
      duration: 8000,
      style: { background: '#7c2d12', color: '#fff', border: '1px solid #9a3412' }
    });
  }
};
export const addAuditLog = (restaurantId: string, orderId: string, action: string, details: string) => {
  const data = getRestaurantData(restaurantId);
  const auth = getCurrentUser();
  if (data && auth) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      if (!order.auditLog) order.auditLog = [];
      const user = data.users.find(u => u.id === auth.userId);
      order.auditLog.push({
        id: `audit_${Date.now()}`,
        action,
        performedBy: user?.name || 'System',
        performedAt: new Date().toISOString(),
        details
      });
      saveRestaurantData(restaurantId, data);
    }
  }
};

// Categories
export const addCategory = (restaurantId: string, category: Category) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.categories.push(category);
    saveRestaurantData(restaurantId, data);
    toast.success(`Category "${category.name}" added`);
  }
};

export const updateCategory = (restaurantId: string, categoryId: string, updates: Partial<Category>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.categories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      data.categories[index] = { ...data.categories[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const deleteCategory = (restaurantId: string, categoryId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const catName = data.categories.find(c => c.id === categoryId)?.name;
    data.categories = data.categories.filter(c => c.id !== categoryId);
    data.menuItems = data.menuItems.filter(m => m.category !== categoryId);
    saveRestaurantData(restaurantId, data);
    toast.success(`Category "${catName}" deleted`);
  }
};

// Menu Items
export const addMenuItem = (restaurantId: string, item: MenuItem) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.menuItems.push(item);
    saveRestaurantData(restaurantId, data);
    toast.success(`Item "${item.name}" added to menu`);
  }
};

export const updateMenuItem = (restaurantId: string, itemId: string, updates: Partial<MenuItem>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.menuItems.findIndex(m => m.id === itemId);
    if (index !== -1) {
      data.menuItems[index] = { ...data.menuItems[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const deleteMenuItem = (restaurantId: string, itemId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const itemName = data.menuItems.find(m => m.id === itemId)?.name;
    data.menuItems = data.menuItems.filter(m => m.id !== itemId);
    saveRestaurantData(restaurantId, data);
    toast.success(`Item "${itemName}" deleted`);
  }
};

// Update customer loyalty
const updateCustomerLoyalty = (restaurantId: string, customerName: string, customerMobile: string, orderTotal: number) => {
  const data = getRestaurantData(restaurantId);
  if (!data || !data.settings.enableLoyalty) return;
  
  let customer = data.customers.find(c => c.mobile === customerMobile && customerMobile !== '') ||
                  (customerMobile === '' ? data.customers.find(c => c.name === customerName && customerName !== '') : undefined);
  
  if (!customer) {
    customer = {
      id: `cust_${Date.now()}`,
      restaurantId,
      name: customerName,
      mobile: customerMobile,
      visits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      tier: 'bronze'
    };
    data.customers.push(customer);
  }
  
  customer.visits++;
  customer.totalSpent += orderTotal;
  customer.lastVisit = new Date().toISOString();
  
  const points = Math.floor(orderTotal * data.settings.loyaltyPointsPerRupee);
  customer.loyaltyPoints += points;
  
  // Update tier
  if (customer.totalSpent >= 50000) customer.tier = 'platinum';
  else if (customer.totalSpent >= 20000) customer.tier = 'gold';
  else if (customer.totalSpent >= 5000) customer.tier = 'silver';
  
  saveRestaurantData(restaurantId, data);
};

// Orders
export const createOrder = (restaurantId: string, order: Order) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    // Assign order number immediately
    order.orderNumber = getNextOrderNumber(restaurantId);
    order.auditLog = [{
      id: `audit_${Date.now()}`,
      action: 'ORDER_CREATED',
      performedBy: order.waiterName,
      performedAt: new Date().toISOString(),
      details: `Order created with ${order.items.length} items`
    }];
    
    data.orders.push(order);

    // Update table status
    const table = data.tables.find(t => t.id === order.tableId);
    if (table) {
      table.status = 'occupied';
      table.currentOrderId = order.id;
    }

    // Inventory deduction happens only on closeOrder, not here
    // This prevents double-deduction and allows cancelled orders to not lose stock

    saveRestaurantData(restaurantId, data);
    toast.success(`Order #${order.orderNumber} created`);
  }
};

export const updateOrder = (restaurantId: string, orderId: string, updates: Partial<Order>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      const oldOrder = data.orders[index];
      data.orders[index] = { ...oldOrder, ...updates };
      
      // Add audit log
      if (!data.orders[index].auditLog) data.orders[index].auditLog = [];
      data.orders[index].auditLog!.push({
        id: `audit_${Date.now()}`,
        action: 'ORDER_UPDATED',
        performedBy: 'System',
        performedAt: new Date().toISOString(),
        details: 'Order details updated'
      });
      
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const updateOrderItemStatus = (
  restaurantId: string,
  orderId: string,
  itemId: string,
  status: 'pending' | 'preparing' | 'ready' | 'served'
) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      const item = order.items.find(i => i.id === itemId);
      if (item) {
        item.status = status;
        
        // Update order status based on item statuses
        const allItemsServed = order.items.every(i => i.status === 'served');
        const anyItemPreparing = order.items.some(i => i.status === 'preparing');
        const anyItemReady = order.items.some(i => i.status === 'ready');
        
        if (allItemsServed && order.status !== 'closed' && order.status !== 'pending_payment') {
          order.status = 'served';
        } else if (anyItemReady && order.status !== 'ready' && order.status !== 'served' && order.status !== 'closed') {
          order.status = 'ready';
        } else if (anyItemPreparing && order.status !== 'preparing' && order.status !== 'ready' && order.status !== 'served' && order.status !== 'closed') {
          order.status = 'preparing';
        }
        
        saveRestaurantData(restaurantId, data);
      }
    }
  }
};

export const updateOrderStatus = (restaurantId: string, orderId: string, status: OrderStatus) => {
  const data = getRestaurantData(restaurantId);
  const auth = getCurrentUser();
  if (data && auth) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (!order.auditLog) order.auditLog = [];
      const user = data.users.find(u => u.id === auth.userId);
      order.auditLog.push({
        id: `audit_${Date.now()}`,
        action: 'STATUS_CHANGED',
        performedBy: user?.name || 'System',
        performedAt: new Date().toISOString(),
        details: `Status changed to ${status}`
      });
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const closeOrder = (restaurantId: string, orderId: string, paymentMethod: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'closed';
      order.closedAt = new Date().toISOString();
      order.paymentMethod = paymentMethod;
      
      // Free up the table
      const table = data.tables.find(t => t.id === order.tableId);
      if (table) {
        table.status = 'available';
        table.currentOrderId = undefined;
      }
      
      // Deduct inventory when order is closed (with decimal support)
      if (data.settings.enableInventory && !order.inventoryDeducted) {
        order.items.forEach(orderItem => {
          const menuItem = data.menuItems.find(m => m.id === orderItem.menuItemId);
          if (menuItem) {
            // Deduct from recipe ingredients
            if (menuItem.recipeIngredients && menuItem.recipeIngredients.length > 0) {
              menuItem.recipeIngredients.forEach(ingredient => {
                const inventoryItem = data.inventory.find(i => i.id === ingredient.inventoryItemId);
                if (inventoryItem) {
                  const consumptionAmount = ingredient.quantity * orderItem.quantity;
                  inventoryItem.quantity = Math.max(0, inventoryItem.quantity - consumptionAmount);
                  
                  if (inventoryItem.quantity <= inventoryItem.minThreshold) {
                    toast.warning(`Low inventory: "${inventoryItem.name}" has only ${inventoryItem.quantity.toFixed(2)} ${inventoryItem.unit} left!`, {
                      duration: 5000,
                      style: { background: '#92400e', color: '#fff', border: '1px solid #b45309' }
                    });
                  }
                }
              });
            }
            
            // Also update menu item's own stock if tracked
            if (menuItem.stockQuantity !== undefined) {
              menuItem.stockQuantity = Math.max(0, menuItem.stockQuantity - orderItem.quantity);
              checkAndNotifyLowStock(restaurantId, menuItem, data);
            }
          }
        });
        order.inventoryDeducted = true;
      }
      
      // Update customer loyalty
      updateCustomerLoyalty(restaurantId, order.customerName, order.customerMobile, order.total);
      
      if (!order.auditLog) order.auditLog = [];
      order.auditLog.push({
        id: `audit_${Date.now()}`,
        action: 'ORDER_CLOSED',
        performedBy: 'System',
        performedAt: new Date().toISOString(),
        details: `Order closed with ${paymentMethod} payment`
      });
      
      saveRestaurantData(restaurantId, data);
      toast.success(`Order #${order.orderNumber} closed`, {
        style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
      });
    }
  }
};

// Mark order as pending payment (Pay Later) with consolidation
export const markOrderAsPendingPayment = (
  restaurantId: string, 
  orderId: string,
  customerName?: string,
  customerMobile?: string
) => {
  const data = getRestaurantData(restaurantId);
  if (!data) return;
  
  const order = data.orders.find(o => o.id === orderId);
  if (!order) return;
  
  // Update order with customer info if provided
  if (customerName) order.customerName = customerName;
  if (customerMobile) order.customerMobile = customerMobile;
  
  // Check for existing pending payment with same mobile number
  const mobileToMatch = customerMobile || order.customerMobile;
  const existingPending = data.orders.find(o => 
    o.status === 'pending_payment' && 
    o.id !== orderId &&
    o.customerMobile === mobileToMatch &&
    mobileToMatch.trim() !== ''
  );
  
  if (existingPending) {
    // Consolidate: Add items to existing pending order
    const newItems = order.items.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      addedAt: new Date().toISOString()
    }));
    
    existingPending.items = [...existingPending.items, ...newItems];
    
    // Track consolidated order info to show original dates
    if (!existingPending.consolidatedOrders) existingPending.consolidatedOrders = [];
    existingPending.consolidatedOrders.push({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt
    });
    // Sort by date (newest first)
    existingPending.consolidatedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Recalculate totals
    const newSubTotal = existingPending.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = Math.round(newSubTotal * (data.settings?.taxRate ?? 5) / 100);
    existingPending.subTotal = newSubTotal;
    existingPending.tax = newTax;
    existingPending.total = newSubTotal + newTax;
    existingPending.amountDue = existingPending.total - (existingPending.amountPaid || 0);
    
    // Add audit log
    if (!existingPending.auditLog) existingPending.auditLog = [];
    existingPending.auditLog.push({
      id: `audit_${Date.now()}`,
      action: 'ORDER_CONSOLIDATED',
      performedBy: 'System',
      performedAt: new Date().toISOString(),
      details: `Order #${order.orderNumber} consolidated into pending payment. Total: ₹${existingPending.total}`
    });
    
    // Mark current order as cancelled (since it's now part of the consolidated order)
    order.status = 'cancelled';
    order.closedAt = new Date().toISOString();
    if (!order.auditLog) order.auditLog = [];
    order.auditLog.push({
      id: `audit_${Date.now()}`,
      action: 'ORDER_CONSOLIDATED',
      performedBy: 'System',
      performedAt: new Date().toISOString(),
      details: `Consolidated into pending Order #${existingPending.orderNumber}`
    });
    
    // Free up the table
    const table = data.tables.find(t => t.id === order.tableId);
    if (table) {
      table.status = 'available';
      table.currentOrderId = undefined;
    }
    
    saveRestaurantData(restaurantId, data);
    toast.success(`Order consolidated with existing pending Order #${existingPending.orderNumber}`, {
      style: { background: '#92400e', color: '#fff', border: '1px solid #b45309' }
    });
    return;
  }
  
  // No existing pending - create new pending payment
  order.status = 'pending_payment';
  
  // Initialize partial payment tracking
  if (!order.partialPayments) order.partialPayments = [];
  order.amountPaid = 0;
  order.amountDue = order.total;
  
  // Free up the table immediately for Pay Later orders
  const table = data.tables.find(t => t.id === order.tableId);
  if (table) {
    table.status = 'available';
    table.currentOrderId = undefined;
  }
  
  if (!order.auditLog) order.auditLog = [];
  order.auditLog.push({
    id: `audit_${Date.now()}`,
    action: 'PAYMENT_PENDING',
    performedBy: 'System',
    performedAt: new Date().toISOString(),
    details: 'Order marked as pending payment (Pay Later) - Table freed'
  });
  
  saveRestaurantData(restaurantId, data);
  toast.success(`Order #${order.orderNumber} marked as pending payment - Table freed`, {
    style: { background: '#92400e', color: '#fff', border: '1px solid #b45309' }
  });
};

// Settle a pending payment order (supports partial payments)
export const settlePendingPayment = (
  restaurantId: string, 
  orderId: string, 
  paymentMethod: string, 
  amount?: number // Optional - if not provided, settles full amount
) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const order = data.orders.find(o => o.id === orderId);
    if (order && order.status === 'pending_payment') {
      const paymentAmount = amount ?? order.total;
      const currentPaid = order.amountPaid ?? 0;
      const newPaid = currentPaid + paymentAmount;
      const remaining = order.total - newPaid;
      
      // Initialize partial payments array if needed
      if (!order.partialPayments) order.partialPayments = [];
      if (order.amountPaid === undefined) order.amountPaid = 0;
      if (order.amountDue === undefined) order.amountDue = order.total;
      
      // Record this partial payment
      order.partialPayments.push({
        method: paymentMethod,
        amount: paymentAmount,
        paidAt: new Date().toISOString()
      });
      
      order.amountPaid = newPaid;
      order.amountDue = remaining;
      
      // Only close order if fully paid
      if (remaining <= 0) {
        order.status = 'closed';
        order.closedAt = new Date().toISOString();
        order.paymentMethod = order.partialPayments.map(p => `${p.method}: ₹${p.amount}`).join(', ');
        
        // Update customer loyalty
        updateCustomerLoyalty(restaurantId, order.customerName, order.customerMobile, order.total);
        
        toast.success(`Order #${order.orderNumber} fully paid and closed`, {
          style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
        });
      } else {
        toast.success(`Partial payment of ₹${paymentAmount} recorded. ₹${remaining} remaining`, {
          style: { background: '#92400e', color: '#fff', border: '1px solid #b45309' }
        });
      }
      
      if (!order.auditLog) order.auditLog = [];
      order.auditLog.push({
        id: `audit_${Date.now()}`,
        action: remaining <= 0 ? 'PAYMENT_SETTLED' : 'PARTIAL_PAYMENT',
        performedBy: 'System',
        performedAt: new Date().toISOString(),
        details: remaining <= 0 
          ? `Payment settled via ${paymentMethod} for ₹${order.total}`
          : `Partial payment of ₹${paymentAmount} via ${paymentMethod}. ₹${remaining} remaining`
      });
      
      saveRestaurantData(restaurantId, data);
    }
  }
};

// Get pending payment orders
export const getPendingPayments = (restaurantId: string): Order[] => {
  const data = getRestaurantData(restaurantId);
  if (!data) return [];
  
  return data.orders
    .filter(o => o.status === 'pending_payment')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const cancelOrder = (restaurantId: string, orderId: string, reason: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const order = data.orders.find(o => o.id === orderId);
    if (order) {
      order.status = 'cancelled';
      order.closedAt = new Date().toISOString();
      
      // Restore inventory
      if (data.settings.enableInventory) {
        order.items.forEach(item => {
          const menuItem = data.menuItems.find(m => m.id === item.menuItemId);
          if (menuItem && menuItem.stockQuantity !== undefined) {
            menuItem.stockQuantity += item.quantity;
          }
        });
      }
      
      // Free up the table
      const table = data.tables.find(t => t.id === order.tableId);
      if (table) {
        table.status = 'available';
        table.currentOrderId = undefined;
      }
      
      if (!order.auditLog) order.auditLog = [];
      order.auditLog.push({
        id: `audit_${Date.now()}`,
        action: 'ORDER_CANCELLED',
        performedBy: 'System',
        performedAt: new Date().toISOString(),
        details: `Cancelled: ${reason}`
      });
      
      saveRestaurantData(restaurantId, data);
      toast.success(`Order #${order.orderNumber} cancelled`, {
        style: { background: '#7c2d12', color: '#fff', border: '1px solid #9a3412' }
      });
    }
  }
};

// Reservations
export const createReservation = (restaurantId: string, reservation: Reservation) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.reservations.push(reservation);
    saveRestaurantData(restaurantId, data);
    toast.success('Reservation created');
  }
};

export const updateReservation = (restaurantId: string, reservationId: string, updates: Partial<Reservation>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.reservations.findIndex(r => r.id === reservationId);
    if (index !== -1) {
      data.reservations[index] = { ...data.reservations[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const deleteReservation = (restaurantId: string, reservationId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.reservations = data.reservations.filter(r => r.id !== reservationId);
    saveRestaurantData(restaurantId, data);
    toast.success('Reservation cancelled', {
      style: { background: '#7c2d12', color: '#fff', border: '1px solid #9a3412' }
    });
  }
};

// Inventory
export const addInventoryItem = (restaurantId: string, item: InventoryItem) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.inventory.push(item);
    saveRestaurantData(restaurantId, data);
    toast.success(`Inventory item "${item.name}" added`);
  }
};

export const updateInventoryItem = (restaurantId: string, itemId: string, updates: Partial<InventoryItem>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.inventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      data.inventory[index] = { ...data.inventory[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const deleteInventoryItem = (restaurantId: string, itemId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.inventory = data.inventory.filter(i => i.id !== itemId);
    saveRestaurantData(restaurantId, data);
    toast.success('Inventory item deleted');
  }
};

// Printers
export const addPrinter = (restaurantId: string, printer: Printer) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    // If this is set as default, unset other defaults
    if (printer.isDefault) {
      data.printers.forEach(p => p.isDefault = false);
    }
    data.printers.push(printer);
    saveRestaurantData(restaurantId, data);
    toast.success(`Printer "${printer.name}" added`);
  }
};

export const updatePrinter = (restaurantId: string, printerId: string, updates: Partial<Printer>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.printers.findIndex(p => p.id === printerId);
    if (index !== -1) {
      // If setting as default, unset other defaults
      if (updates.isDefault) {
        data.printers.forEach(p => p.isDefault = false);
      }
      data.printers[index] = { ...data.printers[index], ...updates };
      saveRestaurantData(restaurantId, data);
      toast.success('Printer updated');
    }
  }
};

export const deletePrinter = (restaurantId: string, printerId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const printerName = data.printers.find(p => p.id === printerId)?.name;
    data.printers = data.printers.filter(p => p.id !== printerId);
    saveRestaurantData(restaurantId, data);
    toast.success(`Printer "${printerName}" deleted`);
  }
};

export const getPrinters = (restaurantId: string): Printer[] => {
  const data = getRestaurantData(restaurantId);
  return data?.printers || [];
};

export const getDefaultPrinter = (restaurantId: string): Printer | null => {
  const data = getRestaurantData(restaurantId);
  return data?.printers.find(p => p.isDefault && p.isActive) || data?.printers.find(p => p.isActive) || null;
};

// Get low stock menu items
export const getLowStockMenuItems = (restaurantId: string): MenuItem[] => {
  const data = getRestaurantData(restaurantId);
  if (!data || !data.settings.enableInventory) return [];
  
  return data.menuItems.filter(item => {
    if (item.stockQuantity === undefined) return false;
    const threshold = item.lowStockThreshold ?? 10;
    return item.stockQuantity <= threshold && item.stockQuantity > 0;
  });
};

// Get out of stock menu items
export const getOutOfStockMenuItems = (restaurantId: string): MenuItem[] => {
  const data = getRestaurantData(restaurantId);
  if (!data || !data.settings.enableInventory) return [];
  
  return data.menuItems.filter(item => 
    item.stockQuantity !== undefined && item.stockQuantity === 0
  );
};

// Get low stock inventory items
export const getLowStockInventoryItems = (restaurantId: string): InventoryItem[] => {
  const data = getRestaurantData(restaurantId);
  if (!data) return [];
  
  return data.inventory.filter(item => 
    item.quantity <= item.minThreshold
  );
};

// Check all stock and return alerts
export const checkAllStockAlerts = (restaurantId: string): { 
  lowStockItems: MenuItem[]; 
  outOfStockItems: MenuItem[]; 
  lowInventoryItems: InventoryItem[] 
} => {
  return {
    lowStockItems: getLowStockMenuItems(restaurantId),
    outOfStockItems: getOutOfStockMenuItems(restaurantId),
    lowInventoryItems: getLowStockInventoryItems(restaurantId)
  };
};

// Expenses
export const addExpense = (restaurantId: string, expense: Expense) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.expenses.push(expense);
    saveRestaurantData(restaurantId, data);
    toast.success('Expense recorded');
  }
};

export const deleteExpense = (restaurantId: string, expenseId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.expenses = data.expenses.filter(e => e.id !== expenseId);
    saveRestaurantData(restaurantId, data);
  }
};

// Expense Categories
export const addExpenseCategory = (restaurantId: string, category: ExpenseCategory) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    if (!data.expenseCategories) {
      data.expenseCategories = [];
    }
    data.expenseCategories.push(category);
    saveRestaurantData(restaurantId, data);
    toast.success(`Category "${category.name}" added`);
  }
};

export const updateExpenseCategory = (restaurantId: string, categoryId: string, updates: Partial<ExpenseCategory>) => {
  const data = getRestaurantData(restaurantId);
  if (data && data.expenseCategories) {
    const index = data.expenseCategories.findIndex(c => c.id === categoryId);
    if (index !== -1) {
      data.expenseCategories[index] = { ...data.expenseCategories[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

export const deleteExpenseCategory = (restaurantId: string, categoryId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data && data.expenseCategories) {
    const catName = data.expenseCategories.find(c => c.id === categoryId)?.name;
    data.expenseCategories = data.expenseCategories.filter(c => c.id !== categoryId);
    saveRestaurantData(restaurantId, data);
    toast.success(`Category "${catName}" deleted`);
  }
};

export const getExpenseCategories = (restaurantId: string): ExpenseCategory[] => {
  const data = getRestaurantData(restaurantId);
  return data?.expenseCategories || [];
};

// Staff Attendance
export const checkInStaff = (restaurantId: string, userId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const today = new Date().toISOString().split('T')[0];
    const existing = data.attendance.find(a => a.userId === userId && a.date === today);
    if (!existing) {
      data.attendance.push({
        id: `att_${Date.now()}`,
        userId,
        date: today,
        checkIn: new Date().toISOString(),
        status: 'present'
      });
      saveRestaurantData(restaurantId, data);
      toast.success('Checked in successfully');
    }
  }
};

export const checkOutStaff = (restaurantId: string, userId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const today = new Date().toISOString().split('T')[0];
    const attendance = data.attendance.find(a => a.userId === userId && a.date === today);
    if (attendance && !attendance.checkOut) {
      attendance.checkOut = new Date().toISOString();
      saveRestaurantData(restaurantId, data);
      toast.success('Checked out successfully');
    }
  }
};

// Get orders by date range
export const getOrdersByDateRange = (
  restaurantId: string,
  startDate: Date,
  endDate: Date,
  status?: string
): Order[] => {
  const data = getRestaurantData(restaurantId);
  if (!data) return [];
  
  return data.orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const inRange = orderDate >= startDate && orderDate <= endDate;
    if (status && status !== 'All Orders') {
      return inRange && order.status === status.toLowerCase();
    }
    return inRange;
  });
};

// Get today's orders
export const getTodayOrders = (restaurantId: string): Order[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getOrdersByDateRange(restaurantId, today, tomorrow);
};

// Get weekly orders
export const getWeeklyOrders = (restaurantId: string): Order[] => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return getOrdersByDateRange(restaurantId, weekStart, weekEnd);
};

// Get monthly orders
export const getMonthlyOrders = (restaurantId: string): Order[] => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return getOrdersByDateRange(restaurantId, monthStart, monthEnd);
};

// Get dashboard stats with proper channel breakdown
export const getDashboardStats = (restaurantId: string) => {
  const data = getRestaurantData(restaurantId);
  if (!data) return null;
  
  const todayOrders = getTodayOrders(restaurantId);
  const activeOrders = data.orders.filter(o => o.status === 'active' || o.status === 'preparing');
  
  const todayRevenue = todayOrders
    .filter(o => o.status === 'closed')
    .reduce((sum, o) => sum + o.total, 0);
  
  const totalOrders = todayOrders.length;
  
  // Channel breakdown - FIXED
  const channelStats = {
    dineIn: { orders: 0, amount: 0 },
    takeAway: { orders: 0, amount: 0 },
    homeDelivery: { orders: 0, amount: 0 },
    swiggy: { orders: 0, amount: 0 },
    zomato: { orders: 0, amount: 0 },
    other: { orders: 0, amount: 0 }
  };
  
  todayOrders.forEach(order => {
    const channel = order.channel || 'dineIn';
    if (channelStats[channel]) {
      channelStats[channel].orders++;
      channelStats[channel].amount += order.total;
    }
  });
  
  return {
    totalOrders,
    todayRevenue,
    activeOrders: activeOrders.length,
    channelStats
  };
};

// Tables
export const getTables = (restaurantId: string): Table[] => {
  const data = getRestaurantData(restaurantId);
  return data?.tables || [];
};

export const updateTable = (restaurantId: string, tableId: string, updates: Partial<Table>) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const index = data.tables.findIndex(t => t.id === tableId);
    if (index !== -1) {
      data.tables[index] = { ...data.tables[index], ...updates };
      saveRestaurantData(restaurantId, data);
    }
  }
};

// Merge tables
export const mergeTables = (restaurantId: string, tableIds: string[]) => {
  const data = getRestaurantData(restaurantId);
  if (data && tableIds.length >= 2) {
    const primaryTable = data.tables.find(t => t.id === tableIds[0]);
    if (primaryTable) {
      primaryTable.mergedWith = tableIds.slice(1);
      // Mark other tables as occupied/merged
      tableIds.slice(1).forEach(id => {
        const table = data.tables.find(t => t.id === id);
        if (table) {
          table.status = 'occupied';
        }
      });
      saveRestaurantData(restaurantId, data);
      toast.success('Tables merged');
    }
  }
};

// Split tables
export const splitTables = (restaurantId: string, tableId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    const table = data.tables.find(t => t.id === tableId);
    if (table && table.mergedWith) {
      // Unmerge secondary tables
      table.mergedWith.forEach(id => {
        const mergedTable = data.tables.find(t => t.id === id);
        if (mergedTable) {
          mergedTable.status = 'available';
        }
      });
      table.mergedWith = undefined;
      saveRestaurantData(restaurantId, data);
      toast.success('Tables unmerged');
    }
  }
};

// Export data for backup
export const exportData = (restaurantId: string): string => {
  const data = getRestaurantData(restaurantId);
  return JSON.stringify(data, null, 2);
};

// Import data from backup
export const importData = (restaurantId: string, jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);
    saveRestaurantData(restaurantId, data);
    return true;
  } catch {
    return false;
  }
};

// Clear all data (for testing)
export const clearAllData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_KEY);
};

// Clear all orders for a restaurant
export const clearAllOrders = (restaurantId: string) => {
  const data = getRestaurantData(restaurantId);
  if (data) {
    data.orders = [];
    data.nextOrderNumber = 1;
    // Reset all tables to available
    data.tables.forEach(table => {
      table.status = 'available';
      table.currentOrderId = undefined;
      table.mergedWith = undefined;
    });
    saveRestaurantData(restaurantId, data);
  }
};
