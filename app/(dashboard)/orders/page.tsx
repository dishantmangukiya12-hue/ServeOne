"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MenuItem, Order, Table, OrderChannel, User as StaffUser } from '@/services/dataService';
import { getRestaurantData, createOrder, closeOrder, cancelOrder, updateOrder, saveRestaurantData, getNextOrderNumber } from '@/services/dataService';
import { toast } from 'sonner';
import { getPendingQROrderCount } from '@/components/QROrderManager';
import { useAuth } from '@/contexts/AuthContext';
import { markOrderAsPendingPayment } from '@/services/dataService';

// Extracted components
import {
  OrderStats,
  OrderTabs,
  TableGrid,
  MenuBrowser,
  MobileMenuBrowser,
  OrderCart,
  SplitBillDialog,
  MultiPaymentDialog,
  CustomerDetailsDialog,
  CancelOrderDialog,
  ChangeTableDialog,
  CustomItemDialog,
  CloseOrderDialog,
  GenerateBillDialog,
  PrintKOTDialog,
  SendBillDialog,
  QRPaymentDialog,
  OrderItemsDialog,
  CustomerInfoDialog,
  CloseSummaryDialog,
  TableMenuDialog,
  QROrdersDialog,
  QROrderDetailDialog,
  MobileCartDialog,
} from '@/components/orders';
import type { QROrder } from '@/components/orders';
import { useKeyboardShortcuts } from '@/hooks';

const tabs = ['DINE IN', 'DELIVERIES', 'QSR', 'TAKEAWAY'];

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest: string;
  addedAt?: string;
}

export default function Orders() {
  const { restaurant } = useAuth();
  const [activeTab, setActiveTab] = useState('DINE IN');
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [settings, setSettings] = useState<{ taxRate: number; serviceCharge: number; enableInventory?: boolean; tax?: { cgst: number; sgst: number; serviceCharge: number }; receipt?: { header: string; footer: string; gstNumber: string; showGstNumber: boolean } }>({ taxRate: 5, serviceCharge: 0 });
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState('Admin');
  const [pendingQRCount, setPendingQRCount] = useState(0);

  // Selection state
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Cart state - persist to sessionStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('menew_cart');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    }
    return [];
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [orderChannel, setOrderChannel] = useState<OrderChannel>('dineIn');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentTab, setPaymentTab] = useState<'UPI_QR' | 'CAPTURE' | 'MARK_NC' | 'PAY_LATER' | 'WALLET'>('CAPTURE');
  const [cancelReason, setCancelReason] = useState('');

  // Bill state
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [billNote, setBillNote] = useState('');
  const [applyGST, setApplyGST] = useState(true);
  const [splitBillCount, setSplitBillCount] = useState(1);
  const [sendBillPhone, setSendBillPhone] = useState('');

  // QR Orders state
  const [pendingQROrders, setPendingQROrders] = useState<QROrder[]>([]);
  const [selectedQROrder, setSelectedQROrder] = useState<QROrder | null>(null);

  // Dialog visibility states
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState<Table | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCloseSummary, setShowCloseSummary] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showOrderItemsDialog, setShowOrderItemsDialog] = useState(false);
  const [showKOTDialog, setShowKOTDialog] = useState(false);
  const [showSendBillDialog, setShowSendBillDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCustomerInfoDialog, setShowCustomerInfoDialog] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [showChangeTableDialog, setShowChangeTableDialog] = useState(false);
  const [showSplitBillDialog, setShowSplitBillDialog] = useState(false);
  const [showMultiPaymentDialog, setShowMultiPaymentDialog] = useState(false);
  const [showQROrdersDialog, setShowQROrdersDialog] = useState(false);
  const [showQRDetailDialog, setShowQRDetailDialog] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persist cart to sessionStorage
  useEffect(() => {
    if (cart.length > 0) {
      sessionStorage.setItem('menew_cart', JSON.stringify(cart));
    } else {
      sessionStorage.removeItem('menew_cart');
    }
  }, [cart]);

  // Check for pending QR orders
  useEffect(() => {
    if (!restaurant) return;
    const checkPending = () => setPendingQRCount(getPendingQROrderCount(restaurant.id));
    checkPending();
    const interval = setInterval(checkPending, 3000);
    const handleStorage = () => checkPending();
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [restaurant?.id]);

  useEffect(() => {
    if (!restaurant) return;
    loadData();
  }, [restaurant?.id]);

  const loadData = () => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables);
      setMenuItems(data.menuItems);
      setCategories(data.categories);
      if (data.settings) setSettings(data.settings);
      if (data.users) setStaffList(data.users);
      if (data.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(data.categories[0].id);
      }
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onEscape: () => {
      if (showCustomerDialog) setShowCustomerDialog(false);
      else if (showTableMenu) setShowTableMenu(null);
      else if (showCancelDialog) setShowCancelDialog(false);
      else if (showCloseDialog) setShowCloseDialog(false);
      else if (showBillDialog) setShowBillDialog(false);
      else if (showOrderItemsDialog) setShowOrderItemsDialog(false);
      else if (showKOTDialog) setShowKOTDialog(false);
      else if (showQROrdersDialog) setShowQROrdersDialog(false);
      else if (showSplitBillDialog) setShowSplitBillDialog(false);
      else if (showMultiPaymentDialog) setShowMultiPaymentDialog(false);
      else if (isEditingOrder) {
        setSelectedTable(null);
        setCurrentOrder(null);
        setIsEditingOrder(false);
        setCart([]);
      }
    },
    onTableSelect: (tableNum) => {
      if (!isEditingOrder && !selectedTable) {
        const table = tables.find(t => t.tableNumber === tableNum);
        if (table) handleTableClick(table);
      }
    },
    onNewOrder: () => {
      if (!isEditingOrder && !selectedTable) {
        const availableTable = tables.find(t => t.status === 'available');
        if (availableTable) {
          handleTableClick(availableTable);
          toast.success(`Starting new order for Table ${availableTable.tableNumber}`);
        } else {
          toast.info('No available tables');
        }
      }
    },
    onSearch: () => searchInputRef.current?.focus(),
    enabled: true,
  });

  // Helper functions
  const formatOrderTime = (createdAt: string) => {
    const date = new Date(createdAt);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getElapsedTime = (timestamp: string) => {
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const getTableOrderDetails = (table: Table): Order | null => {
    if (!table.currentOrderId || !restaurant) return null;
    const data = getRestaurantData(restaurant.id);
    if (!data) return null;
    return data.orders.find(o => o.id === table.currentOrderId) || null;
  };

  // Cart calculations
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgstRate = settings.tax?.cgst || 0;
  const sgstRate = settings.tax?.sgst || 0;
  const cgstAmount = Math.round(cartTotal * (cgstRate / 100));
  const sgstAmount = Math.round(cartTotal * (sgstRate / 100));
  const hasSplitGST = cgstRate > 0 || sgstRate > 0;
  const tax = hasSplitGST ? cgstAmount + sgstAmount : Math.round(cartTotal * (settings.taxRate / 100));
  const serviceChargeRate = settings.tax?.serviceCharge ?? settings.serviceCharge ?? 0;
  const serviceCharge = Math.round(cartTotal * (serviceChargeRate / 100));
  const total = cartTotal + tax + serviceCharge;

  // Cart actions
  const addToCart = (item: MenuItem) => {
    if (settings.enableInventory && (item.available === false || (item.stockQuantity !== undefined && item.stockQuantity !== null && item.stockQuantity <= 0))) {
      toast.error(`"${item.name}" is out of stock`);
      return; // Block out-of-stock items
    }
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        specialRequest: '',
        addedAt: new Date().toISOString()
      }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const updateSpecialRequest = (menuItemId: string, request: string) => {
    setCart(prev => prev.map(item =>
      item.menuItemId === menuItemId ? { ...item, specialRequest: request } : item
    ));
  };

  const addCustomItemToCart = () => {
    if (!customItemName.trim() || !customItemPrice.trim()) {
      toast.error('Please enter both item name and price');
      return;
    }
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    const customId = `custom_${Date.now()}`;
    setCart(prev => [...prev, {
      menuItemId: customId,
      name: customItemName.trim(),
      price: price,
      quantity: 1,
      specialRequest: '',
      addedAt: new Date().toISOString()
    }]);
    const itemName = customItemName.trim();
    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomItemDialog(false);
    toast.success(`Added "${itemName}" to order`);
  };

  // Table handlers
  const handleTableClick = (table: Table) => {
    // Clear any stale cart from sessionStorage when switching tables
    sessionStorage.removeItem('menew_cart');
    if (table.status === 'available') {
      setSelectedTable(table);
      setCurrentOrder(null);
      setIsEditingOrder(true);
      setShowCustomerDialog(true);
      setCustomerName('');
      setCustomerMobile('');
      setAdults(1);
      setKids(0);
      setCart([]);
      setOrderChannel('dineIn');
      setSelectedWaiter('Admin');
    } else if (restaurant) {
      const data = getRestaurantData(restaurant.id);
      if (data && table.currentOrderId) {
        const order = data.orders.find(o => o.id === table.currentOrderId);
        if (order) {
          setCurrentOrder(order);
          setSelectedTable(table);
          setIsEditingOrder(false);
          setCustomerName(order.customerName);
          setCustomerMobile(order.customerMobile);
          setAdults(order.adults);
          setKids(order.kids);
          setCart(order.items.map(i => ({
            menuItemId: i.menuItemId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            specialRequest: i.specialRequest,
            addedAt: i.addedAt || order.createdAt
          })));
          setShowOrderItemsDialog(true);
        }
      }
    }
  };

  const handleMenuClick = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data && table.currentOrderId) {
      const order = data.orders.find(o => o.id === table.currentOrderId);
      if (order) {
        setSelectedTable(table);
        setCurrentOrder(order);
        setIsEditingOrder(false);
        setCustomerName(order.customerName);
        setCustomerMobile(order.customerMobile);
        setAdults(order.adults);
        setKids(order.kids);
        setCart(order.items.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          specialRequest: i.specialRequest,
          addedAt: i.addedAt || order.createdAt
        })));
        setShowTableMenu(table);
      }
    }
  };

  const handleEditOrder = () => {
    setShowOrderItemsDialog(false);
    setShowTableMenu(null);
    setIsEditingOrder(true);
  };

  const handleChangeTable = (newTableId: string) => {
    if (!currentOrder || !selectedTable || !restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (!data) return;
    const newTable = data.tables.find(t => t.id === newTableId);
    const oldTable = data.tables.find(t => t.id === selectedTable.id);
    if (!newTable || !oldTable) return;
    const orderIndex = data.orders.findIndex(o => o.id === currentOrder.id);
    if (orderIndex !== -1) data.orders[orderIndex].tableId = newTableId;
    oldTable.status = 'available';
    oldTable.currentOrderId = undefined;
    newTable.status = 'occupied';
    newTable.currentOrderId = currentOrder.id;
    saveRestaurantData(restaurant.id, data);
    setTables([...data.tables]);
    setSelectedTable(newTable);
    setCurrentOrder({ ...currentOrder, tableId: newTableId });
    setShowChangeTableDialog(false);
    setShowTableMenu(null);
    toast.success(`Order moved to Table ${newTable.tableNumber}`, {
      style: { background: '#1e3a5f', color: '#fff', border: '1px solid #2563eb' }
    });
  };

  // Order handlers
  const confirmOrder = () => {
    if (!selectedTable || cart.length === 0 || !restaurant) return;
    if (currentOrder) {
      updateOrder(restaurant.id, currentOrder.id, {
        items: cart.map(c => {
          const existingItem = currentOrder.items.find(i => i.menuItemId === c.menuItemId);
          return {
            id: existingItem?.id || `item_${Date.now()}_${c.menuItemId}`,
            menuItemId: c.menuItemId,
            name: c.name,
            price: c.price,
            quantity: c.quantity,
            specialRequest: c.specialRequest,
            addedAt: existingItem?.addedAt || c.addedAt || new Date().toISOString()
          };
        }),
        subTotal: cartTotal,
        tax,
        total,
        channel: orderChannel
      });
      toast.success('Order updated');
    } else {
      const order: Order = {
        id: `order_${Date.now()}`,
        restaurantId: restaurant.id,
        tableId: selectedTable.id,
        customerName: customerName || 'Guest',
        customerMobile: customerMobile || '',
        adults,
        kids,
        items: cart.map(c => ({
          id: `item_${Date.now()}_${c.menuItemId}`,
          menuItemId: c.menuItemId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          specialRequest: c.specialRequest,
          addedAt: c.addedAt || new Date().toISOString()
        })),
        status: 'active',
        paymentMethod: '',
        subTotal: cartTotal,
        tax,
        discount: 0,
        total,
        createdAt: new Date().toISOString(),
        waiterName: selectedWaiter || 'Admin',
        channel: orderChannel,
        orderNumber: 0,
        auditLog: []
      };
      createOrder(restaurant.id, order);
    }
    resetOrderState();
    loadData();
  };

  const handleCloseOrder = () => {
    if (!currentOrder || !restaurant) return;
    
    // Handle Pay Later case
    if (paymentTab === 'PAY_LATER') {
      // First update order with customer info
      updateOrder(restaurant.id, currentOrder.id, {
        customerName: customerName || currentOrder.customerName,
        customerMobile: customerMobile || currentOrder.customerMobile,
      });
      markOrderAsPendingPayment(
        restaurant.id, 
        currentOrder.id,
        customerName || currentOrder.customerName,
        customerMobile || currentOrder.customerMobile
      );
      setShowCloseDialog(false);
      resetOrderState();
      loadData();
      return;
    }
    
    // Regular close order flow
    updateOrder(restaurant.id, currentOrder.id, {
      customerName: customerName || currentOrder.customerName,
      customerMobile: customerMobile || currentOrder.customerMobile,
    });
    closeOrder(restaurant.id, currentOrder.id, paymentMethod);
    setShowCloseDialog(false);
    setShowCloseSummary(true);
  };

  const handleCancelOrder = () => {
    if (!currentOrder || !restaurant) return;
    cancelOrder(restaurant.id, currentOrder.id, cancelReason);
    setShowCancelDialog(false);
    setShowTableMenu(null);
    resetOrderState();
    setCancelReason('');
    loadData();
  };

  const handleCloseSummaryDone = () => {
    setShowCloseSummary(false);
    setShowTableMenu(null);
    resetOrderState();
    loadData();
  };

  const resetOrderState = () => {
    setSelectedTable(null);
    setCurrentOrder(null);
    setCart([]);
    setIsEditingOrder(false);
    setShowOrderItemsDialog(false);
  };

  const handleClearOrCancel = () => {
    if (currentOrder && currentOrder.items.length > 0 && restaurant) {
      if (!window.confirm('Are you sure you want to cancel this order? This cannot be undone.')) return;
      cancelOrder(restaurant.id, currentOrder.id, 'Order cancelled by user');
      resetOrderState();
      loadData();
    } else {
      setCart([]);
    }
  };

  const handleBack = () => {
    resetOrderState();
  };

  // Bill handlers
  const handleGenerateBill = () => {
    setShowBillDialog(true);
    setDiscountAmount('');
    setDiscountPercent('');
    setBillNote('');
    setApplyGST(true);
    setSplitBillCount(1);
  };

  const handleSplitBill = () => setShowSplitBillDialog(true);

  const handlePaySplit = (_splitIndex: number, method: string, amount: number) => {
    if (!currentOrder || !restaurant) return;
    // Record the split payment in audit log
    const auditLog = currentOrder.auditLog || [];
    auditLog.push({
      id: `audit_${Date.now()}`,
      action: 'SPLIT_PAYMENT',
      performedBy: selectedWaiter || 'System',
      performedAt: new Date().toISOString(),
      details: `Split payment ₹${amount} received via ${method}`
    });
    updateOrder(restaurant.id, currentOrder.id, { auditLog });
    toast.success(`Split payment ₹${amount} received via ${method}`);
  };

  const handleMultiPayment = (payments: { id: string; method: string; amount: number }[]) => {
    if (!currentOrder || !restaurant) return;
    updateOrder(restaurant.id, currentOrder.id, {
      customerName: customerName || currentOrder.customerName,
      customerMobile: customerMobile || currentOrder.customerMobile,
    });
    const paymentSummary = payments.map(p => `${p.method}: ₹${p.amount}`).join(', ');
    closeOrder(restaurant.id, currentOrder.id, paymentSummary);
    setShowMultiPaymentDialog(false);
    setShowCloseDialog(false);
    setShowCloseSummary(true);
    setPaymentMethod(paymentSummary);
  };

  // QR Order handlers
  const loadPendingQROrders = () => {
    if (!restaurant) return;
    const orders = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const restaurantOrders = orders.filter(
      (o: QROrder) => o.restaurantId === restaurant.id && o.status === 'pending_approval'
    );
    setPendingQROrders(restaurantOrders);
  };

  const handleOpenQROrders = () => {
    loadPendingQROrders();
    setShowQROrdersDialog(true);
  };

  const handleAcceptQROrder = (order: QROrder) => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (!data) {
      toast.error('Restaurant data not found');
      return;
    }
    let table = data.tables.find((t: Table) => t.id === order.tableId);
    if (!table) table = data.tables.find((t: Table) => t.tableNumber === order.tableNumber);
    if (!table) {
      toast.error(`Table ${order.tableNumber} not found`);
      return;
    }
    if (table.status === 'occupied' && table.currentOrderId) {
      const existingOrder = data.orders.find((o: Order) => o.id === table!.currentOrderId);
      if (existingOrder) {
        const newItems = order.items.map(item => ({
          id: `item_${Date.now()}_${item.menuItemId}`,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
          addedAt: new Date().toISOString()
        }));
        const updatedItems = [...existingOrder.items, ...newItems];
        const newSubTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cgst = data.settings?.tax?.cgst || 0;
        const sgst = data.settings?.tax?.sgst || 0;
        const hasSplitGST = cgst > 0 || sgst > 0;
        const newTax = hasSplitGST
          ? Math.round(newSubTotal * (cgst / 100)) + Math.round(newSubTotal * (sgst / 100))
          : Math.round(newSubTotal * (data.settings?.taxRate ?? 5) / 100);
        const svcRate = data.settings?.tax?.serviceCharge ?? data.settings?.serviceCharge ?? 0;
        const newServiceCharge = Math.round(newSubTotal * (svcRate / 100));
        const newTotal = newSubTotal + newTax + newServiceCharge;
        updateOrder(restaurant.id, existingOrder.id, {
          items: updatedItems,
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal
        });
        updateQROrderStatus(order.id, 'approved');
        setPendingQROrders(prev => prev.filter(o => o.id !== order.id));
        setShowQRDetailDialog(false);
        loadData();
        toast.success(`Items added to Table ${order.tableNumber}`, {
          style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
        });
        return;
      }
    }
    const nextOrderNumber = getNextOrderNumber(restaurant.id);
    const newOrder: Order = {
      id: order.id,
      restaurantId: restaurant.id,
      tableId: table.id,
      customerName: order.customerName,
      customerMobile: order.customerMobile,
      adults: 1,
      kids: 0,
      items: order.items.map(item => ({
        id: `item_${Date.now()}_${item.menuItemId}`,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specialRequest: item.specialRequest,
        addedAt: new Date().toISOString()
      })),
      status: 'active',
      paymentMethod: '',
      subTotal: (() => {
        return order.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
      })(),
      tax: (() => {
        const sub = order.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        const c = data.settings?.tax?.cgst || 0;
        const s = data.settings?.tax?.sgst || 0;
        const split = c > 0 || s > 0;
        return split ? Math.round(sub * (c / 100)) + Math.round(sub * (s / 100)) : Math.round(sub * (data.settings?.taxRate ?? 5) / 100);
      })(),
      discount: 0,
      total: (() => {
        const sub = order.items.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0);
        const c = data.settings?.tax?.cgst || 0;
        const s = data.settings?.tax?.sgst || 0;
        const split = c > 0 || s > 0;
        const t = split ? Math.round(sub * (c / 100)) + Math.round(sub * (s / 100)) : Math.round(sub * (data.settings?.taxRate ?? 5) / 100);
        const sv = data.settings?.tax?.serviceCharge ?? data.settings?.serviceCharge ?? 0;
        const sc = Math.round(sub * (sv / 100));
        return sub + t + sc;
      })(),
      createdAt: new Date().toISOString(),
      closedAt: undefined,
      waiterName: 'QR Order',
      channel: 'other',
      orderNumber: nextOrderNumber,
      auditLog: [{
        id: `audit_${Date.now()}`,
        action: 'QR_ORDER_ACCEPTED',
        performedBy: 'Manager',
        performedAt: new Date().toISOString(),
        details: `Order accepted from Table ${order.tableNumber}`
      }]
    };
    data.orders.push(newOrder);
    table.status = 'occupied';
    table.currentOrderId = order.id;
    saveRestaurantData(restaurant.id, data);
    updateQROrderStatus(order.id, 'approved');
    setPendingQROrders(prev => prev.filter(o => o.id !== order.id));
    setShowQRDetailDialog(false);
    loadData();
    toast.success(`Order #${nextOrderNumber} accepted for Table ${order.tableNumber}`, {
      style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
    });
  };

  const handleRejectQROrder = (order: QROrder) => {
    updateQROrderStatus(order.id, 'rejected');
    setPendingQROrders(prev => prev.filter(o => o.id !== order.id));
    setShowQRDetailDialog(false);
    toast.error(`Order rejected for Table ${order.tableNumber}`, {
      style: { background: '#7c2d12', color: '#fff', border: '1px solid #9a3412' }
    });
  };

  const updateQROrderStatus = (orderId: string, status: 'approved' | 'rejected') => {
    const pending = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const updated = pending.map((o: QROrder) =>
      o.id === orderId ? { ...o, status } : o
    );
    localStorage.setItem('pending_qr_orders', JSON.stringify(updated));
  };

  // Customer info save
  const handleSaveCustomerInfo = () => {
    if (!restaurant || !currentOrder) return;
    updateOrder(restaurant.id, currentOrder.id, {
      customerName: customerName || currentOrder.customerName,
      customerMobile: customerMobile || currentOrder.customerMobile,
    });
    setCurrentOrder({
      ...currentOrder,
      customerName: customerName || currentOrder.customerName,
      customerMobile: customerMobile || currentOrder.customerMobile,
    });
    setShowCustomerInfoDialog(false);
  };

  if (!restaurant) return null;

  // Editing order view
  if (isEditingOrder && selectedTable && !showCustomerDialog && !showOrderItemsDialog) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <MobileMenuBrowser
            categories={categories}
            menuItems={menuItems}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchInputRef={searchInputRef}
            cart={cart}
            total={total}
            tableNumber={selectedTable.tableNumber}
            hasExistingOrder={!!currentOrder}
            onAddToCart={addToCart}
            enableInventory={settings.enableInventory}
            onBack={handleBack}
            onShowCustomItem={() => setShowCustomItemDialog(true)}
            onViewCart={() => setShowMobileCart(true)}
            onClearCart={handleClearOrCancel}
          />
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex h-[calc(100vh-64px)]">
          {/* Left Sidebar - Back button */}
          <div className="w-16 bg-card border-r p-4 flex flex-col">
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-2 text-primary hover:text-primary/80"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-xs text-muted-foreground mt-4 text-center">
              Table {selectedTable.tableNumber}
              {currentOrder && <span className="text-primary block">(Editing)</span>}
            </div>
          </div>

          {/* Menu Browser */}
          <MenuBrowser
            categories={categories}
            menuItems={menuItems}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchInputRef={searchInputRef}
            onAddToCart={addToCart}
            enableInventory={settings.enableInventory}
          />

          {/* Order Cart */}
          <OrderCart
            cart={cart}
            cartTotal={cartTotal}
            tax={tax}
            serviceCharge={serviceCharge}
            total={total}
            taxRate={settings.taxRate}
            serviceChargeRate={serviceChargeRate}
            hasExistingOrder={!!currentOrder}
            onAddCustomItem={() => setShowCustomItemDialog(true)}
            onClearOrCancel={handleClearOrCancel}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onUpdateSpecialRequest={updateSpecialRequest}
            onConfirmOrder={confirmOrder}
            cgstRate={cgstRate}
            sgstRate={sgstRate}
            cgstAmount={cgstAmount}
            sgstAmount={sgstAmount}
          />
        </div>

        {/* Mobile Cart Dialog */}
        <MobileCartDialog
          open={showMobileCart}
          onOpenChange={setShowMobileCart}
          cart={cart}
          cartTotal={cartTotal}
          tax={tax}
          total={total}
          taxRate={settings.taxRate}
          hasExistingOrder={!!currentOrder}
          cgstRate={cgstRate}
          sgstRate={sgstRate}
          cgstAmount={cgstAmount}
          sgstAmount={sgstAmount}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onUpdateSpecialRequest={updateSpecialRequest}
          onAddCustomItem={() => { setShowMobileCart(false); setShowCustomItemDialog(true); }}
          onBack={() => setShowMobileCart(false)}
          onConfirm={() => { confirmOrder(); setShowMobileCart(false); }}
        />

        {/* Custom Item Dialog */}
        <CustomItemDialog
          open={showCustomItemDialog}
          onOpenChange={setShowCustomItemDialog}
          itemName={customItemName}
          setItemName={setCustomItemName}
          itemPrice={customItemPrice}
          setItemPrice={setCustomItemPrice}
          onCancel={() => { setShowCustomItemDialog(false); setCustomItemName(''); setCustomItemPrice(''); }}
          onAdd={addCustomItemToCart}
        />
      </div>
    );
  }

  // Main orders view (table grid)
  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        <OrderStats
          tables={tables}
          getOrderForTable={getTableOrderDetails}
          pendingQRCount={pendingQRCount}
          onOpenQROrders={handleOpenQROrders}
        />
        <OrderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <TableGrid
          tables={activeTab === 'DINE IN' ? tables : tables.filter(t => {
            const order = getTableOrderDetails(t);
            if (!order) return activeTab === 'DINE IN';
            const channelMap: Record<string, string> = { 'DELIVERIES': 'homeDelivery', 'QSR': 'other', 'TAKEAWAY': 'takeAway' };
            return order.channel === (channelMap[activeTab] || 'dineIn');
          })}
          getOrderForTable={getTableOrderDetails}
          onTableClick={handleTableClick}
          onMenuClick={handleMenuClick}
          formatOrderTime={formatOrderTime}
        />
      </main>

      {/* Customer Details Dialog */}
      <CustomerDetailsDialog
        open={showCustomerDialog}
        onOpenChange={(open) => {
          if (!open) resetOrderState();
          setShowCustomerDialog(open);
        }}
        selectedTable={selectedTable}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerMobile={customerMobile}
        setCustomerMobile={setCustomerMobile}
        adults={adults}
        setAdults={setAdults}
        kids={kids}
        setKids={setKids}
        orderChannel={orderChannel}
        setOrderChannel={setOrderChannel}
        onCancel={() => { setShowCustomerDialog(false); setSelectedTable(null); }}
        onProceed={() => setShowCustomerDialog(false)}
        restaurantId={restaurant.id}
        staffList={staffList}
        selectedWaiter={selectedWaiter}
        setSelectedWaiter={setSelectedWaiter}
      />

      {/* Order Items Dialog */}
      <OrderItemsDialog
        open={showOrderItemsDialog}
        onOpenChange={setShowOrderItemsDialog}
        order={currentOrder}
        selectedTable={selectedTable}
        formatOrderTime={formatOrderTime}
        onClose={() => { setShowOrderItemsDialog(false); resetOrderState(); }}
        onEdit={handleEditOrder}
      />

      {/* Table Menu Dialog */}
      <TableMenuDialog
        open={!!showTableMenu}
        onOpenChange={() => setShowTableMenu(null)}
        table={showTableMenu}
        onShowQR={() => setShowQRDialog(true)}
        onPrintKOT={() => setShowKOTDialog(true)}
        onSendBill={() => { setSendBillPhone(currentOrder?.customerMobile || ''); setShowSendBillDialog(true); }}
        onGenerateBill={handleGenerateBill}
        onSplitBill={handleSplitBill}
        onChangeTable={() => setShowChangeTableDialog(true)}
        onCancelOrder={() => setShowCancelDialog(true)}
        onCloseOrder={() => {
          if (currentOrder) {
            setCustomerName(currentOrder.customerName);
            setCustomerMobile(currentOrder.customerMobile);
          }
          setShowCloseDialog(true);
        }}
        onAddCustomerInfo={() => {
          if (currentOrder) {
            setCustomerName(currentOrder.customerName);
            setCustomerMobile(currentOrder.customerMobile);
          }
          setShowCustomerInfoDialog(true);
        }}
      />

      {/* Customer Info Dialog */}
      <CustomerInfoDialog
        open={showCustomerInfoDialog}
        onOpenChange={setShowCustomerInfoDialog}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerMobile={customerMobile}
        setCustomerMobile={setCustomerMobile}
        onCancel={() => setShowCustomerInfoDialog(false)}
        onSave={handleSaveCustomerInfo}
      />

      {/* Close Order Dialog */}
      <CloseOrderDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        order={currentOrder}
        tableNumber={selectedTable?.tableNumber}
        paymentTab={paymentTab}
        setPaymentTab={setPaymentTab}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        customerName={customerName}
        setCustomerName={setCustomerName}
        customerMobile={customerMobile}
        setCustomerMobile={setCustomerMobile}
        onOpenMultiPayment={() => setShowMultiPaymentDialog(true)}
        onCancel={() => setShowCloseDialog(false)}
        onClose={handleCloseOrder}
      />

      {/* Close Summary Dialog */}
      <CloseSummaryDialog
        open={showCloseSummary}
        onOpenChange={setShowCloseSummary}
        order={currentOrder}
        selectedTable={selectedTable}
        paymentMethod={paymentMethod}
        onDone={handleCloseSummaryDone}
      />

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
      />

      {/* Generate Bill Dialog */}
      <GenerateBillDialog
        open={showBillDialog}
        onOpenChange={setShowBillDialog}
        order={currentOrder}
        restaurant={restaurant}
        selectedTable={selectedTable}
        settings={settings}
        discountAmount={discountAmount}
        setDiscountAmount={setDiscountAmount}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        billNote={billNote}
        setBillNote={setBillNote}
        applyGST={applyGST}
        setApplyGST={setApplyGST}
        splitBillCount={splitBillCount}
        setSplitBillCount={setSplitBillCount}
        onSplitBill={handleSplitBill}
        onCancel={() => setShowBillDialog(false)}
        onPrint={() => { window.print(); setShowBillDialog(false); }}
        formatOrderTime={formatOrderTime}
      />

      {/* Print KOT Dialog */}
      <PrintKOTDialog
        open={showKOTDialog}
        onOpenChange={setShowKOTDialog}
        order={currentOrder}
        restaurant={restaurant}
        selectedTable={selectedTable}
        formatOrderTime={formatOrderTime}
        onClose={() => setShowKOTDialog(false)}
        onPrint={() => { window.print(); setShowKOTDialog(false); }}
      />

      {/* Send Bill Dialog */}
      <SendBillDialog
        open={showSendBillDialog}
        onOpenChange={setShowSendBillDialog}
        phoneNumber={sendBillPhone}
        setPhoneNumber={setSendBillPhone}
        onCancel={() => setShowSendBillDialog(false)}
        onSend={() => {
          toast.info('Bill sending via SMS/WhatsApp is not yet configured. Please share the bill manually.');
          setShowSendBillDialog(false);
        }}
      />

      {/* QR Payment Dialog */}
      <QRPaymentDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        order={currentOrder}
        onClose={() => setShowQRDialog(false)}
      />

      {/* Change Table Dialog */}
      <ChangeTableDialog
        open={showChangeTableDialog}
        onOpenChange={setShowChangeTableDialog}
        tables={tables}
        currentTableId={selectedTable?.id}
        onSelectTable={handleChangeTable}
        onCancel={() => setShowChangeTableDialog(false)}
      />

      {/* QR Orders Dialog */}
      <QROrdersDialog
        open={showQROrdersDialog}
        onOpenChange={setShowQROrdersDialog}
        pendingOrders={pendingQROrders}
        onSelectOrder={(order) => { setSelectedQROrder(order); setShowQRDetailDialog(true); }}
        getElapsedTime={getElapsedTime}
      />

      {/* QR Order Detail Dialog */}
      <QROrderDetailDialog
        open={showQRDetailDialog}
        onOpenChange={setShowQRDetailDialog}
        order={selectedQROrder}
        onReject={handleRejectQROrder}
        onAccept={handleAcceptQROrder}
      />

      {/* Split Bill Dialog */}
      <SplitBillDialog
        open={showSplitBillDialog}
        onClose={() => setShowSplitBillDialog(false)}
        order={currentOrder}
        onPaySplit={handlePaySplit}
      />

      {/* Multi-Payment Dialog */}
      <MultiPaymentDialog
        open={showMultiPaymentDialog}
        onClose={() => setShowMultiPaymentDialog(false)}
        order={currentOrder}
        onConfirm={handleMultiPayment}
      />
    </div>
  );
}

