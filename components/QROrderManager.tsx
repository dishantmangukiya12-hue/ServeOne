"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { QrCode, Check, X, Bell, User, ShoppingBag, Table } from 'lucide-react';
import { getRestaurantData, saveRestaurantData, updateOrder, type Restaurant, type Order } from '@/services/dataService';
import { toast } from 'sonner';

interface QROrder {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerMobile: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialRequest: string;
  }>;
  total: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  channel: 'qr_ordering';
}

interface QROrderManagerProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

// Export function to get pending count for Header
export function getPendingQROrderCount(restaurantId: string): number {
  const pendingOrders = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
  return pendingOrders.filter((o: QROrder) => 
    o.restaurantId === restaurantId && o.status === 'pending_approval'
  ).length;
}

export default function QROrderManager({ restaurant, isOpen, onClose }: QROrderManagerProps) {
  const [pendingOrders, setPendingOrders] = useState<QROrder[]>([]);
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<QROrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // Play notification sound for new orders
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.log('Audio not supported');
    }
  }, []);

  // Load pending orders
  const loadPendingOrders = useCallback(() => {
    const orders = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const restaurantOrders = orders.filter(
      (o: QROrder) => o.restaurantId === restaurant.id && o.status === 'pending_approval'
    );

    if (restaurantOrders.length > pendingOrders.length) {
      setHasNewOrders(true);
      playNotificationSound();
    }

    setPendingOrders(restaurantOrders);
  }, [restaurant.id, pendingOrders.length, playNotificationSound]);

  // Listen for storage changes (from customer orders)
  useEffect(() => {
    loadPendingOrders();

    const handleStorageChange = () => {
      loadPendingOrders();
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadPendingOrders, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [loadPendingOrders]);

  // Reset new order indicator when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHasNewOrders(false);
    }
  }, [isOpen]);

  const handleAcceptOrder = (order: QROrder) => {
    const data = getRestaurantData(restaurant.id);
    if (!data) {
      toast.error('Restaurant data not found');
      return;
    }

    // Find table by ID or by tableNumber
    let table = data.tables.find((t: any) => t.id === order.tableId);
    
    // If not found by ID, try finding by tableNumber
    if (!table) {
      table = data.tables.find((t: any) => t.tableNumber === order.tableNumber);
    }

    if (!table) {
      toast.error(`Table ${order.tableNumber} not found`);
      console.error('Looking for table:', order.tableId, 'or tableNumber:', order.tableNumber);
      console.error('Available tables:', data.tables.map((t: any) => ({ id: t.id, number: t.tableNumber })));
      return;
    }

    // If table is occupied, add items to existing order instead of creating new
    if (table.status === 'occupied' && table.currentOrderId) {
      const existingOrder = data.orders.find((o: Order) => o.id === table.currentOrderId);
      
      if (existingOrder) {
        // Add new items to existing order
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
        const newTax = Math.round(newSubTotal * (data.settings?.taxRate ?? 5) / 100);
        const newTotal = newSubTotal + newTax;

        // Update existing order
        updateOrder(restaurant.id, existingOrder.id, {
          items: updatedItems,
          subTotal: newSubTotal,
          tax: newTax,
          total: newTotal
        });

        // Update pending orders
        const pending = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
        const updated = pending.map((o: QROrder) => 
          o.id === order.id ? { ...o, status: 'approved' } : o
        );
        localStorage.setItem('pending_qr_orders', JSON.stringify(updated));

        setPendingOrders(prev => prev.filter(o => o.id !== order.id));
        setShowOrderDetail(false);
        toast.success(`Items added to existing order at Table ${order.tableNumber}`);
        return;
      }
    }

    // Get next order number
    const closedOrders = data.orders.filter((o: Order) => o.status === 'closed' && o.orderNumber);
    const maxOrderNumber = closedOrders.reduce((max: number, o: Order) => Math.max(max, o.orderNumber || 0), 0);
    const nextOrderNumber = maxOrderNumber + 1;

    // Create the actual order in the system
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
      subTotal: order.total,
      tax: 0,
      discount: 0,
      total: order.total,
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

    // Add to restaurant orders
    data.orders.push(newOrder);
    
    // Update table status
    table.status = 'occupied';
    table.currentOrderId = order.id;
    
    // Save using the proper function
    saveRestaurantData(restaurant.id, data);

    // Update pending orders
    const pending = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const updated = pending.map((o: QROrder) => 
      o.id === order.id ? { ...o, status: 'approved' } : o
    );
    localStorage.setItem('pending_qr_orders', JSON.stringify(updated));

    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setShowOrderDetail(false);
    toast.success(`Order #${nextOrderNumber} accepted for Table ${order.tableNumber}`);
  };

  const handleRejectOrder = (order: QROrder) => {
    const pending = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const updated = pending.map((o: QROrder) => 
      o.id === order.id ? { ...o, status: 'rejected' } : o
    );
    localStorage.setItem('pending_qr_orders', JSON.stringify(updated));

    setPendingOrders(prev => prev.filter(o => o.id !== order.id));
    setShowOrderDetail(false);
    toast.success('Order rejected');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = (timestamp: string) => {
    const elapsed = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <>
      {/* Floating Notification Button */}
      {!isOpen && (
        <button
          onClick={() => onClose()}
          className="fixed bottom-4 right-4 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <QrCode className="h-6 w-6" />
          {pendingOrders.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center ${
              hasNewOrders ? 'bg-destructive animate-bounce' : 'bg-warning'
            }`}>
              {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
            </span>
          )}
        </button>
      )}

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Orders Management
              {pendingOrders.length > 0 && (
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  {pendingOrders.length} pending
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending QR orders</p>
                <p className="text-sm">Orders from customer scans will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="p-4 cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetail(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Table className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-foreground">Table {order.tableNumber}</h4>
                            <span className="text-xs text-muted-foreground">
                              {getElapsedTime(order.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {order.customerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="h-3 w-3" />
                              {order.items.length} items
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">₹{order.total}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-bold text-2xl">{selectedOrder.tableNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-2xl text-primary">₹{selectedOrder.total}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Customer</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customerMobile}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-muted p-2 rounded">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        {item.specialRequest && (
                          <p className="text-xs text-warning mt-1">Note: {item.specialRequest}</p>
                        )}
                      </div>
                      <p className="font-medium">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRejectOrder(selectedOrder)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => handleAcceptOrder(selectedOrder)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept & Place
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

