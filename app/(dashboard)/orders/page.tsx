"use client";

import { PageLoading } from '@/components/PageLoading';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { MenuItem, Order, Table, OrderChannel, User as StaffUser, RestaurantSettings } from '@/types/restaurant';
import { useOrders, useMenuItems, useCategories, useTables, useUsers, useRestaurant, useCreateOrder, useUpdateOrder, useCancelOrder } from '@/hooks/api';
import { useQROrders, useUpdateQROrder } from '@/hooks/api/useQROrders';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api-client';

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
  const [selectedWaiter, setSelectedWaiter] = useState('Admin');

  // React Query hooks for data
  const { data: tablesData } = useTables(restaurant?.id);
  const { data: menuData } = useMenuItems(restaurant?.id);
  const { data: categoriesData } = useCategories(restaurant?.id);
  const { data: restaurantData } = useRestaurant(restaurant?.id);
  const { data: usersData } = useUsers(restaurant?.id);
  const { data: ordersData } = useOrders(restaurant?.id, { limit: 500 });
  const { data: qrOrdersData } = useQROrders(restaurant?.id);

  // Mutations
  const createOrderMutation = useCreateOrder(restaurant?.id);
  const updateOrderMutation = useUpdateOrder(restaurant?.id);
  const cancelOrderMutation = useCancelOrder(restaurant?.id);
  const updateQROrderMutation = useUpdateQROrder(restaurant?.id);

  // Derive data from hooks
  const tables = useMemo(() => tablesData?.tables?.filter((t: Table) => !t.mergedWith) || [], [tablesData]);
  const menuItems = useMemo(() => menuData?.items || [], [menuData]);
  const categories = useMemo(() => categoriesData?.categories || [], [categoriesData]);
  const settings = useMemo<RestaurantSettings>(() => restaurantData?.settings || { taxRate: 5, serviceCharge: 0, currency: '₹', enableLoyalty: false, loyaltyPointsPerRupee: 0, enableInventory: false }, [restaurantData]);
  const staffList = useMemo(() => usersData?.users || [], [usersData]);
  const allOrders = useMemo(() => ordersData?.orders || [], [ordersData]);

  // Derive QR order data from hook
  const pendingQROrders = useMemo(() => 
    (qrOrdersData?.orders || []).filter(o => o.status === 'pending_approval') as QROrder[],
  [qrOrdersData]);
  const pendingQRCount = pendingQROrders.length;

  // Selection state
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  // Cart state - persist to sessionStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('serveone_cart');
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
      sessionStorage.setItem('serveone_cart', JSON.stringify(cart));
    } else {
      sessionStorage.removeItem('serveone_cart');
    }
  }, [cart]);

  // Set initial category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

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
    return allOrders.find(o => o.id === table.currentOrderId) || null;
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
    sessionStorage.removeItem('serveone_cart');
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
      if (table.currentOrderId) {
        const order = allOrders.find(o => o.id === table.currentOrderId);
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
    if (table.currentOrderId) {
      const order = allOrders.find(o => o.id === table.currentOrderId);
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
    const newTable = tables.find((t: Table) => t.id === newTableId);
    if (!newTable) return;
    // Update order's tableId via API - server handles table status
    updateOrderMutation.mutate(
      { orderId: currentOrder.id, tableId: newTableId } as any,
      {
        onSuccess: () => {
          setSelectedTable(newTable);
          setCurrentOrder({ ...currentOrder, tableId: newTableId });
          setShowChangeTableDialog(false);
          setShowTableMenu(null);
          toast.success(`Order moved to Table ${newTable.tableNumber}`, {
            style: { background: '#1e3a5f', color: '#fff', border: '1px solid #2563eb' }
          });
        },
      }
    );
  };

  // Order handlers
  const confirmOrder = () => {
    if (!selectedTable || cart.length === 0 || !restaurant) return;
    if (currentOrder) {
      updateOrderMutation.mutate(
        {
          orderId: currentOrder.id,
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
          }) as unknown as Record<string, unknown>[],
          subTotal: cartTotal,
          tax,
          total,
        },
        { onSuccess: () => toast.success('Order updated') }
      );
    } else {
      createOrderMutation.mutate({
        restaurantId: restaurant.id,
        tableId: selectedTable.id,
        customerName: customerName || 'Guest',
        customerMobile: customerMobile || '',
        adults,
        kids,
        items: cart.map(c => ({
          menuItemId: c.menuItemId,
          name: c.name,
          price: c.price,
          quantity: c.quantity,
          specialRequest: c.specialRequest,
        })) as unknown as Record<string, unknown>[],
        channel: orderChannel,
        subTotal: cartTotal,
        tax,
        total,
        waiterName: selectedWaiter || 'Admin',
      });
    }
    resetOrderState();
  };

  const handleCloseOrder = () => {
    if (!currentOrder || !restaurant) return;
    
    // Handle Pay Later case
    if (paymentTab === 'PAY_LATER') {
      updateOrderMutation.mutate(
        {
          orderId: currentOrder.id,
          customerName: customerName || currentOrder.customerName,
          customerMobile: customerMobile || currentOrder.customerMobile,
          status: 'pending_payment',
        },
        {
          onSuccess: () => {
            setShowCloseDialog(false);
            resetOrderState();
          },
        }
      );
      return;
    }
    
    // Regular close order flow
    updateOrderMutation.mutate(
      {
        orderId: currentOrder.id,
        customerName: customerName || currentOrder.customerName,
        customerMobile: customerMobile || currentOrder.customerMobile,
        status: 'closed',
        paymentMethod,
        closedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setShowCloseDialog(false);
          setShowCloseSummary(true);
        },
      }
    );
  };

  const handleCancelOrder = () => {
    if (!currentOrder || !restaurant) return;
    cancelOrderMutation.mutate(currentOrder.id, {
      onSuccess: () => {
        setShowCancelDialog(false);
        setShowTableMenu(null);
        resetOrderState();
        setCancelReason('');
      },
    });
  };

  const handleCloseSummaryDone = () => {
    setShowCloseSummary(false);
    setShowTableMenu(null);
    resetOrderState();
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
      cancelOrderMutation.mutate(currentOrder.id, {
        onSuccess: () => resetOrderState(),
      });
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
    const auditLog = currentOrder.auditLog || [];
    auditLog.push({
      id: `audit_${Date.now()}`,
      action: 'SPLIT_PAYMENT',
      performedBy: selectedWaiter || 'System',
      performedAt: new Date().toISOString(),
      details: `Split payment ₹${amount} received via ${method}`
    });
    updateOrderMutation.mutate(
      { orderId: currentOrder.id, auditLog: auditLog as unknown as Record<string, unknown>[] },
      { onSuccess: () => toast.success(`Split payment ₹${amount} received via ${method}`) }
    );
  };

  const handleMultiPayment = (payments: { id: string; method: string; amount: number }[]) => {
    if (!currentOrder || !restaurant) return;
    const paymentSummary = payments.map(p => `${p.method}: ₹${p.amount}`).join(', ');
    updateOrderMutation.mutate(
      {
        orderId: currentOrder.id,
        customerName: customerName || currentOrder.customerName,
        customerMobile: customerMobile || currentOrder.customerMobile,
        status: 'closed',
        paymentMethod: paymentSummary,
        closedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setShowMultiPaymentDialog(false);
          setShowCloseDialog(false);
          setShowCloseSummary(true);
          setPaymentMethod(paymentSummary);
        },
      }
    );
  };

  // QR Order handlers
  const handleOpenQROrders = () => {
    setShowQROrdersDialog(true);
  };

  const handleAcceptQROrder = (order: QROrder) => {
    if (!restaurant) return;

    let table = tables.find((t: Table) => t.id === order.tableId);
    if (!table) table = tables.find((t: Table) => t.tableNumber === order.tableNumber);
    if (!table) {
      toast.error(`Table ${order.tableNumber} not found`);
      return;
    }
    if (table.status === 'occupied' && table.currentOrderId) {
      const existingOrder = allOrders.find((o: Order) => o.id === table!.currentOrderId);
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
        const cgst = settings?.tax?.cgst || 0;
        const sgst = settings?.tax?.sgst || 0;
        const hasSplitGST = cgst > 0 || sgst > 0;
        const newTax = hasSplitGST
          ? Math.round(newSubTotal * (cgst / 100)) + Math.round(newSubTotal * (sgst / 100))
          : Math.round(newSubTotal * (settings?.taxRate ?? 5) / 100);
        const svcRate = settings?.tax?.serviceCharge ?? settings?.serviceCharge ?? 0;
        const newServiceCharge = Math.round(newSubTotal * (svcRate / 100));
        const newTotal = newSubTotal + newTax + newServiceCharge;
        updateOrderMutation.mutate(
          {
            orderId: existingOrder.id,
            items: updatedItems as unknown as Record<string, unknown>[],
            subTotal: newSubTotal,
            tax: newTax,
            total: newTotal,
          },
          {
            onSuccess: () => {
              updateQROrderMutation.mutate({ qrOrderId: order.id, status: 'approved' });
              setShowQRDetailDialog(false);
              toast.success(`Items added to Table ${order.tableNumber}`, {
                style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
              });
            },
          }
        );
        return;
      }
    }
    // Create new order from QR order
    createOrderMutation.mutate(
      {
        restaurantId: restaurant.id,
        tableId: table.id,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        adults: 1,
        kids: 0,
        items: order.items.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialRequest: item.specialRequest,
        })) as unknown as Record<string, unknown>[],
        channel: 'other',
        waiterName: 'QR Order',
      },
      {
        onSuccess: () => {
          updateQROrderMutation.mutate({ qrOrderId: order.id, status: 'approved' });
          setShowQRDetailDialog(false);
          toast.success(`QR order accepted for Table ${order.tableNumber}`, {
            style: { background: '#14532d', color: '#fff', border: '1px solid #166534' }
          });
        },
      }
    );
  };

  const handleRejectQROrder = (order: QROrder) => {
    updateQROrderMutation.mutate({ qrOrderId: order.id, status: 'rejected' });
    setShowQRDetailDialog(false);
    toast.error(`Order rejected for Table ${order.tableNumber}`, {
      style: { background: '#7c2d12', color: '#fff', border: '1px solid #9a3412' }
    });
  };

  // Customer info save
  const handleSaveCustomerInfo = () => {
    if (!restaurant || !currentOrder) return;
    updateOrderMutation.mutate(
      {
        orderId: currentOrder.id,
        customerName: customerName || currentOrder.customerName,
        customerMobile: customerMobile || currentOrder.customerMobile,
      },
      {
        onSuccess: () => {
          setCurrentOrder({
            ...currentOrder,
            customerName: customerName || currentOrder.customerName,
            customerMobile: customerMobile || currentOrder.customerMobile,
          });
          setShowCustomerInfoDialog(false);
        },
      }
    );
  };

  if (!restaurant) return <PageLoading message="Loading orders..." />;

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

