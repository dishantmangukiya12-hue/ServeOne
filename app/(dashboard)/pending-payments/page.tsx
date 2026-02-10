"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/hooks/useServerSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, CreditCard, Clock, User, Table2, Package, XCircle } from 'lucide-react';
import type { Order } from '@/services/dataService';
import { getPendingPayments, settlePendingPayment, cancelOrder } from '@/services/dataService';
import { toast } from 'sonner';

// Format time from order createdAt
const formatOrderTime = (createdAt: string) => {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Calculate elapsed time
const getElapsedTime = (createdAt: string) => {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m ago`;
  }
  return `${mins}m ago`;
};

export default function PendingPayments() {
  const { restaurant } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('Cash');
  const [settleAmount, setSettleAmount] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (restaurant) {
      loadPendingPayments();
    }
  }, [restaurant?.id]);

  useEffect(() => {
    filterOrders();
  }, [pendingOrders, searchQuery]);

  const loadPendingPayments = () => {
    if (!restaurant) return;
    const orders = getPendingPayments(restaurant.id);
    setPendingOrders(orders);
  };
  useDataRefresh(loadPendingPayments);

  const filterOrders = () => {
    let filtered = [...pendingOrders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName.toLowerCase().includes(query) ||
        o.customerMobile.includes(query) ||
        o.id.toLowerCase().includes(query) ||
        o.orderNumber.toString().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const openSettleDialog = (order: Order) => {
    setSelectedOrder(order);
    const amountDue = order.amountDue ?? order.total;
    setSettlePaymentMethod('Cash');
    setSettleAmount(amountDue.toString());
    setIsPartialPayment(false);
    setShowSettleDialog(true);
  };

  const handleSettlePayment = () => {
    if (!selectedOrder || !restaurant) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    settlePendingPayment(restaurant.id, selectedOrder.id, settlePaymentMethod, amount);
    setShowSettleDialog(false);
    setSettleAmount('');
    loadPendingPayments();
  };

  const handleCancelOrder = () => {
    if (!selectedOrder || !restaurant) return;
    cancelOrder(restaurant.id, selectedOrder.id, cancelReason || 'Cancelled by user');
    setShowCancelDialog(false);
    setShowOrderDetails(false);
    setCancelReason('');
    loadPendingPayments();
  };

  // Calculate totals
  const totalPendingAmount = filteredOrders.reduce((sum, o) => sum + (o.amountDue ?? o.total), 0);
  const totalOrders = filteredOrders.length;

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-warning" />
              Pending Payments
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage orders with pending payments and settle them
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="p-3 md:p-4 bg-warning/10">
            <div className="text-xs md:text-sm text-muted-foreground">Pending Orders</div>
            <div className="text-xl md:text-2xl font-bold text-warning">{totalOrders}</div>
          </Card>
          <Card className="p-3 md:p-4 bg-info/10">
            <div className="text-xs md:text-sm text-muted-foreground">Total Due</div>
            <div className="text-xl md:text-2xl font-bold text-info">₹{totalPendingAmount.toLocaleString()}</div>
          </Card>
          <Card className="p-3 md:p-4 bg-primary/10">
            <div className="text-xs md:text-sm text-muted-foreground">Avg Due</div>
            <div className="text-xl md:text-2xl font-bold text-primary">
              ₹{totalOrders > 0 ? Math.round(totalPendingAmount / totalOrders) : 0}
            </div>
          </Card>
          <Card className="p-3 md:p-4 bg-primary/10">
            <div className="text-xs md:text-sm text-muted-foreground">Partial Paid</div>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {filteredOrders.filter(o => (o.amountPaid ?? 0) > 0).length}
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Orders Grid - Orders Style UI */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-2 border-l-warning"
                onClick={() => viewOrderDetails(order)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">#{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">{getElapsedTime(order.createdAt)}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-warning hover:bg-warning/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSettleDialog(order);
                      }}
                    >
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{order.customerName}</div>
                    <div className="text-xs text-muted-foreground">{order.customerMobile}</div>
                  </div>
                </div>

                {/* Table & Items */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Table2 className="h-4 w-4" />
                    <span>Table {order.tableId ? parseInt(order.tableId.slice(-2)) || '-' : '-'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
                  </div>
                </div>

                {/* Amount Section */}
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-xl font-bold text-warning">₹{order.total.toLocaleString()}</div>
                    </div>
                    {(order.amountPaid ?? 0) > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Due</div>
                        <div className="text-lg font-bold text-destructive">₹{(order.amountDue ?? order.total).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  {(order.amountPaid ?? 0) > 0 && (
                    <div className="mt-2 text-xs text-primary">
                      Paid: ₹{order.amountPaid} via {order.partialPayments?.map(p => p.method).join(', ')}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">No pending payments</h3>
            <p className="text-muted-foreground text-sm">
              Orders marked as &quot;Pay Later&quot; will appear here for settlement
            </p>
          </Card>
        )}
      </main>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Order #{selectedOrder?.orderNumber || '-'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="bg-warning/10 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-warning">Pending Payment</span>
                  <span className="text-xs text-muted-foreground">{getElapsedTime(selectedOrder.createdAt)}</span>
                </div>
              </div>

              {/* Customer & Table Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Customer</div>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  <div className="text-muted-foreground">{selectedOrder.customerMobile}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Table</div>
                  <div className="font-medium">
                    Table {selectedOrder.tableId ? parseInt(selectedOrder.tableId.slice(-2)) || '-' : '-'}
                  </div>
                  <div className="text-muted-foreground">{selectedOrder.adults + selectedOrder.kids} guests</div>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-lg font-bold">₹{selectedOrder.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                    <div className="text-lg font-bold text-primary">₹{selectedOrder.amountPaid || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Due</div>
                    <div className="text-lg font-bold text-warning">₹{selectedOrder.amountDue ?? selectedOrder.total}</div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="text-sm font-medium mb-2">Order Items</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-medium">₹{item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Previous Payments */}
              {selectedOrder.partialPayments && selectedOrder.partialPayments.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Payment History</div>
                  <div className="space-y-1">
                    {selectedOrder.partialPayments.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span>{payment.method}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(payment.paidAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="font-medium text-primary">₹{payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consolidated Orders - Show original order dates */}
              {selectedOrder.consolidatedOrders && selectedOrder.consolidatedOrders.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2 text-info">Consolidated Orders</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    <div className="flex items-center justify-between text-sm py-1 border-b">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>Order #{selectedOrder.orderNumber}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {selectedOrder.consolidatedOrders.map((consolidated, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>Order #{consolidated.orderNumber}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(consolidated.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-warning hover:bg-warning/90"
                  onClick={() => {
                    setShowOrderDetails(false);
                    openSettleDialog(selectedOrder);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Settle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settle Payment Dialog */}
      <Dialog open={showSettleDialog} onOpenChange={setShowSettleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-warning" />
              Settle Payment - Order #{selectedOrder?.orderNumber || '-'}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Amount Summary */}
              <div className="bg-warning/10 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-lg font-bold text-warning">₹{selectedOrder.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                    <div className="text-lg font-bold text-primary">₹{selectedOrder.amountPaid || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Due</div>
                    <div className="text-lg font-bold text-warning">₹{selectedOrder.amountDue ?? selectedOrder.total}</div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs text-muted-foreground">Payment Method</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1 bg-card"
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Payment Amount</label>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPartialPayment}
                      onChange={(e) => {
                        setIsPartialPayment(e.target.checked);
                        const amountDue = selectedOrder.amountDue ?? selectedOrder.total;
                        setSettleAmount(e.target.checked ? '' : amountDue.toString());
                      }}
                      className="rounded"
                    />
                    Partial Payment
                  </label>
                </div>
                <Input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1"
                />
              </div>

              {/* Previous Payments */}
              {selectedOrder.partialPayments && selectedOrder.partialPayments.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Previous Payments</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedOrder.partialPayments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{payment.method}</span>
                        <span className="font-medium">₹{payment.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSettleDialog(false)}
                >
                  CANCEL
                </Button>
                <Button
                  className="flex-1 bg-warning hover:bg-warning/90"
                  onClick={handleSettlePayment}
                  disabled={!settleAmount || parseFloat(settleAmount) <= 0}
                >
                  {isPartialPayment ? 'RECORD PARTIAL' : 'SETTLE FULL'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Cancel Order #{selectedOrder?.orderNumber || '-'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this pending payment order? This action cannot be undone.
            </p>

            <div>
              <label className="text-xs text-muted-foreground">Cancellation Reason (optional)</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelDialog(false)}
              >
                KEEP ORDER
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90"
                onClick={handleCancelOrder}
              >
                <XCircle className="h-4 w-4 mr-2" />
                CANCEL ORDER
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
