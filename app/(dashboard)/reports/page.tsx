"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/hooks/useServerSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ChevronDown, Download, Eye, Calendar, Printer, MessageSquare, CreditCard } from 'lucide-react';
import type { Order } from '@/services/dataService';
import { getOrdersByDateRange, getPendingPayments, settlePendingPayment } from '@/services/dataService';
import { toast } from 'sonner';


// Format time from order createdAt
const formatOrderTime = (createdAt: string) => {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const reportTypes = [
  'Order History',
  'Pending Payments',
  'Daily Summary',
  'Item Report',
  'Waiter Report',
  'Channel Report',
  'Table Report',
];



export default function Reports() {
  const { restaurant } = useAuth();
  const [selectedReport, setSelectedReport] = useState('Order History');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState('Today');
  const [selectedPayment, setSelectedPayment] = useState('All');
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  const [showCustomDateDialog, setShowCustomDateDialog] = useState(false);
  
  // Settle payment dialog state
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [orderToSettle, setOrderToSettle] = useState<Order | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState('Cash');
  const [settleAmount, setSettleAmount] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (restaurant) {
      if (selectedReport === 'Pending Payments') {
        loadPendingPayments();
      } else {
        loadOrders();
      }
    }
  }, [restaurant?.id, dateRange, customStartDate, customEndDate, selectedReport]);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedPayment, searchQuery]);

  const loadOrders = () => {
    if (!restaurant) return;
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (dateRange) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'Yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'This Week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'Last Week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'Custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setDate(endDate.getDate() + 1);
        } else {
          return;
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
    }

    // Get all orders in date range, then filter for closed OR pending with partial payments
    const allOrders = getOrdersByDateRange(restaurant.id, startDate, endDate);
    const relevantOrders = allOrders.filter(o => 
      o.status === 'closed' || 
      (o.status === 'pending_payment' && o.partialPayments && o.partialPayments.length > 0)
    );
    setOrders(relevantOrders);
  };

  const loadPendingPayments = () => {
    if (!restaurant) return;
    const pendingOrders = getPendingPayments(restaurant.id);
    setOrders(pendingOrders);
  };
  useDataRefresh(() => {
    if (selectedReport === 'Pending Payments') {
      loadPendingPayments();
    } else {
      loadOrders();
    }
  });

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by payment method
    if (selectedPayment !== 'All') {
      filtered = filtered.filter(o => o.paymentMethod === selectedPayment);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customerName.toLowerCase().includes(query) ||
        o.customerMobile.includes(query) ||
        o.id.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const getDateRangeLabel = () => {
    // For Today and Yesterday, show the actual date
    if (dateRange === 'Today' || dateRange === 'Yesterday') {
      return dateRange;
    }
    // For Custom or other ranges, just show "Custom"
    return 'Custom';
  };

  // Calculate totals - use amountPaid for partial payment orders
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.amountPaid || o.total), 0);
  const totalOrders = filteredOrders.length;
  const totalItems = filteredOrders.reduce((sum, o) => sum + o.items.reduce((itemSum, i) => itemSum + i.quantity, 0), 0);

  // Payment breakdown - use amountPaid for partial payment orders
  const paymentBreakdown: { [key: string]: number } = {};
  filteredOrders.forEach(o => {
    const method = o.paymentMethod || 'Cash';
    const amount = o.amountPaid || o.total;
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + amount;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Expand orders with partial payments into transaction rows
  const getTransactionRows = (orders: Order[]) => {
    const rows: Array<{
      type: 'order' | 'partial_payment';
      order: Order;
      payment?: { method: string; amount: number; paidAt: string };
      paymentIndex?: number;
    }> = [];

    orders.forEach(order => {
      if (order.partialPayments && order.partialPayments.length > 0) {
        // Show each partial payment as a separate row
        order.partialPayments.forEach((payment, idx) => {
          rows.push({
            type: 'partial_payment',
            order,
            payment,
            paymentIndex: idx
          });
        });
      } else {
        // Regular order without partial payments
        rows.push({
          type: 'order',
          order
        });
      }
    });

    return rows;
  };

  const transactionRows = getTransactionRows(paginatedOrders);
  const totalTransactionPages = Math.ceil(transactionRows.length / itemsPerPage);
  const paginatedTransactions = transactionRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const openSettleDialog = (order: Order) => {
    setOrderToSettle(order);
    const amountDue = order.amountDue ?? order.total;
    setSettlePaymentMethod('Cash');
    setSettleAmount(amountDue.toString());
    setIsPartialPayment(false);
    setShowSettleDialog(true);
  };

  const handleSettlePayment = () => {
    if (!orderToSettle || !restaurant) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    settlePendingPayment(restaurant.id, orderToSettle.id, settlePaymentMethod, amount);
    setShowSettleDialog(false);
    setOrderToSettle(null);
    setSettleAmount('');
    loadPendingPayments();
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Mobile', 'Table', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment'];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.createdAt).toLocaleString(),
      o.customerName,
      o.customerMobile,
      o.tableId.slice(-2),
      o.items.length,
      o.subTotal,
      o.tax,
      o.total,
      o.paymentMethod || '-'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        {/* Filters Bar - Mobile Optimized */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
          {/* Report Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowReportDropdown(!showReportDropdown)}
              className="flex items-center gap-2 text-primary font-medium bg-card px-3 py-2 rounded-lg border w-full md:w-auto justify-between md:justify-start"
            >
              <span className="flex items-center gap-2">
                <span className="hidden md:inline">📊</span> {selectedReport}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showReportDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-20 min-w-48">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedReport(type);
                      setShowReportDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-muted text-sm"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center gap-2 text-primary font-medium bg-card px-3 py-2 rounded-lg border w-full md:w-auto justify-between md:justify-start"
            >
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> {getDateRangeLabel()}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showDateDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-20 min-w-40">
                {['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'Custom'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (option === 'Custom') {
                        setShowCustomDateDialog(true);
                      }
                      setDateRange(option);
                      setShowDateDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-muted text-sm"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker - Full width on mobile */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setDateRange('Custom');
                if (e.target.value) {
                  const start = new Date(e.target.value);
                  const end = customEndDate ? new Date(customEndDate) : new Date(e.target.value);
                  end.setDate(end.getDate() + 1);
                  const allOrders = getOrdersByDateRange(restaurant.id, start, end);
                  const relevantOrders = allOrders.filter(o =>
                    o.status === 'closed' ||
                    (o.status === 'pending_payment' && o.partialPayments && o.partialPayments.length > 0)
                  );
                  setOrders(relevantOrders);
                }
              }}
              className="flex-1 md:w-32 lg:w-40 text-sm border-primary text-primary"
            />
            <span className="text-muted-foreground text-sm">TO</span>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setDateRange('Custom');
                if (e.target.value && customStartDate) {
                  const start = new Date(customStartDate);
                  const end = new Date(e.target.value);
                  end.setDate(end.getDate() + 1);
                  const allOrders = getOrdersByDateRange(restaurant.id, start, end);
                  const relevantOrders = allOrders.filter(o =>
                    o.status === 'closed' ||
                    (o.status === 'pending_payment' && o.partialPayments && o.partialPayments.length > 0)
                  );
                  setOrders(relevantOrders);
                }
              }}
              className="flex-1 md:w-32 lg:w-40 text-sm border-primary text-primary"
            />
          </div>

          {/* Payment Filter */}
          <div className="relative">
            <button
              onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
              className="flex items-center gap-2 text-primary font-medium bg-card px-3 py-2 rounded-lg border w-full md:w-auto justify-between md:justify-start"
            >
              <span className="flex items-center gap-2">
                <span className="hidden md:inline">💳</span> {selectedPayment}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {showPaymentDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-card border rounded-lg shadow-lg z-20 min-w-32">
                {['All', 'Cash', 'UPI', 'Card', 'Online'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedPayment(type);
                      setShowPaymentDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-muted text-sm"
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 text-primary text-sm bg-card px-3 py-2 rounded-lg border w-full md:w-auto"
          >
            <Download className="h-4 w-4" /> <span className="md:hidden">Export CSV</span><span className="hidden md:inline">Export</span>
          </button>
        </div>

        {/* Summary Cards - 2x2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card className="p-3 md:p-4 bg-primary/10">
            <div className="text-xs md:text-sm text-muted-foreground">Closed Orders</div>
            <div className="text-xl md:text-2xl font-bold text-primary">{totalOrders}</div>
          </Card>
          <Card className="p-3 md:p-4 bg-info/10">
            <div className="text-xs md:text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-xl md:text-2xl font-bold text-info">₹{totalRevenue.toLocaleString()}</div>
          </Card>
          <Card className="p-3 md:p-4 bg-warning/10">
            <div className="text-xs md:text-sm text-muted-foreground">Items Sold</div>
            <div className="text-xl md:text-2xl font-bold text-warning">{totalItems}</div>
          </Card>
          <Card className="p-3 md:p-4 bg-primary/10">
            <div className="text-xs md:text-sm text-muted-foreground">Avg Order</div>
            <div className="text-xl md:text-2xl font-bold text-primary">₹{totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}</div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Orders Table - Scrollable on mobile */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Order #</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Table</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Items</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Payment</th>
                  <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((row, idx) => {
                    const order = row.order;
                    const isPartialPayment = row.type === 'partial_payment';
                    const payment = row.payment;

                    return (
                      <tr key={`${order.id}-${idx}`} className={`border-b hover:bg-muted ${isPartialPayment ? 'bg-info/10/50' : ''}`}>
                        <td className="p-2 md:p-3 text-xs md:text-sm font-medium">
                          #{order.orderNumber || '-'}
                          {isPartialPayment && (
                            <span className="ml-1 text-[10px] text-info">(PP{row.paymentIndex! + 1})</span>
                          )}
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm whitespace-nowrap">
                          {isPartialPayment && payment
                            ? new Date(payment.paidAt).toLocaleString()
                            : new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm">
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-[10px] md:text-xs text-muted-foreground">{order.customerMobile}</div>
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm">{order.tableId ? parseInt(order.tableId.slice(-2)) || '-' : '-'}</td>
                        <td className="p-2 md:p-3 text-xs md:text-sm">
                          {isPartialPayment ? '-' : `${order.items.reduce((sum, i) => sum + i.quantity, 0)} items`}
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm font-medium">
                          {isPartialPayment && payment ? (
                            <span className="text-info">₹{payment.amount.toLocaleString()}</span>
                          ) : (
                            `₹${order.total.toLocaleString()}`
                          )}
                        </td>
                        <td className="p-2 md:p-3 text-xs md:text-sm">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs w-fit ${
                              order.status === 'pending_payment'
                                ? 'bg-warning/10 text-warning'
                                : isPartialPayment
                                  ? 'bg-info/10 text-info'
                                  : 'bg-primary/10 text-primary'
                            }`}>
                              {order.status === 'pending_payment' ? 'Pending' :
                               isPartialPayment ? `Partial - ${payment?.method}` :
                               (order.paymentMethod || 'Cash')}
                            </span>
                            {!isPartialPayment && order.partialPayments && order.partialPayments.length > 0 && order.status === 'closed' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-warning/10 text-warning w-fit">
                                Pay Later
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 md:p-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => viewOrderDetails(order)}
                              className="text-primary hover:bg-primary/10 p-1.5 md:p-2 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {order.status === 'pending_payment' && (
                              <button
                                onClick={() => openSettleDialog(order)}
                                className="text-warning hover:bg-warning/10 p-1.5 md:p-2 rounded"
                                title="Settle Payment"
                              >
                                <CreditCard className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                <tr>
                  <td className="p-16 text-center text-muted-foreground" colSpan={8}>
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-lg mb-2">
                      {selectedReport === 'Pending Payments' ? 'No pending payments' : 'No closed orders found'}
                    </p>
                    <p className="text-sm">
                      {selectedReport === 'Pending Payments' 
                        ? 'Orders marked as Pay Later will appear here' 
                        : 'Close orders from the Orders page to see them here'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>

        {/* Pagination */}
        {totalTransactionPages > 1 && (
          <div className="flex items-center justify-center gap-1 md:gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-primary hover:bg-muted rounded disabled:opacity-50 text-sm"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-primary hover:bg-muted rounded disabled:opacity-50 text-sm"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(3, totalTransactionPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalTransactionPages - 2, currentPage - 1)) + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded text-sm ${
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'text-primary hover:bg-muted'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalTransactionPages, p + 1))}
              disabled={currentPage === totalTransactionPages}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-primary hover:bg-muted rounded disabled:opacity-50 text-sm"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalTransactionPages)}
              disabled={currentPage === totalTransactionPages}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-primary hover:bg-muted rounded disabled:opacity-50 text-sm"
            >
              »
            </button>
          </div>
        )}

        {/* Payment Breakdown */}
        {Object.keys(paymentBreakdown).length > 0 && (
          <Card className="mt-4 md:mt-6 p-3 md:p-4">
            <h3 className="font-medium mb-3 md:mb-4 text-sm md:text-base">Payment Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {Object.entries(paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="bg-muted p-2 md:p-3 rounded-lg">
                  <div className="text-xs md:text-sm text-muted-foreground">{method}</div>
                  <div className="text-base md:text-lg font-bold">₹{amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>

      {/* Custom Date Dialog */}
      <Dialog open={showCustomDateDialog} onOpenChange={setShowCustomDateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCustomDateDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => {
                  if (customStartDate && customEndDate) {
                    setDateRange('Custom');
                    setShowCustomDateDialog(false);
                    loadOrders();
                  }
                }}
                disabled={!customStartDate || !customEndDate}
              >
                APPLY
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Order Details #{selectedOrder?.orderNumber || '-'}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedOrder.customerName}</div>
                  <div className="text-muted-foreground text-[10px] md:text-xs">{selectedOrder.customerMobile}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Order Time</div>
                  <div className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Table</div>
                  <div className="font-medium">{selectedOrder.tableId ? parseInt(selectedOrder.tableId.slice(-2)) || '-' : '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedOrder.status === 'pending_payment' 
                        ? 'bg-warning/10 text-warning' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {selectedOrder.status === 'pending_payment' ? 'Pending Payment' : 'Closed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[300px] text-xs md:text-sm">
                  <thead className="bg-muted">
                    <tr className="border-b">
                      <th className="p-1.5 md:p-2 text-left">Item</th>
                      <th className="p-1.5 md:p-2 text-center">Qty</th>
                      <th className="p-1.5 md:p-2 text-right">Price</th>
                      <th className="p-1.5 md:p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-1.5 md:p-2">
                          <div>{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatOrderTime(item.addedAt || selectedOrder.createdAt)}
                          </div>
                        </td>
                        <td className="p-1.5 md:p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">₹ {item.price}</td>
                        <td className="p-2 text-right">₹ {item.price * item.quantity}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>

              <div className="border-t pt-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subTotal}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span>Tax ({Math.round((selectedOrder.tax / selectedOrder.subTotal) * 100)}%)</span>
                  <span>₹{selectedOrder.tax}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base md:text-lg mt-2">
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Partial Payment History - show for all orders with partial payments */}
              {selectedOrder.partialPayments && selectedOrder.partialPayments.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2 text-primary">Payment History</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedOrder.partialPayments.map((payment, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1 border-b last:border-0">
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
                  <div className="flex justify-between text-sm font-medium mt-2 pt-2 border-t">
                    <span>Total Paid</span>
                    <span className="text-primary">₹{selectedOrder.amountPaid || 0}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {selectedOrder.status === 'pending_payment' && (
                  <Button
                    className="flex-1 bg-warning hover:bg-warning/90 text-xs md:text-sm py-2 md:py-2.5"
                    onClick={() => {
                      setShowOrderDetails(false);
                      openSettleDialog(selectedOrder);
                    }}
                  >
                    <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" /> SETTLE PAYMENT
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 text-xs md:text-sm py-2 md:py-2.5"
                  onClick={() => {/* View PAX silently */}}
                >
                  <Eye className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" /> VIEW PAX
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-xs md:text-sm py-2 md:py-2.5"
                  onClick={() => {/* KOT printed silently */}}
                >
                  <Printer className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" /> VIEW KOT
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-xs md:text-sm py-2 md:py-2.5"
                  onClick={() => setShowOrderDetails(false)}
                >
                  CLOSE
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
            <DialogTitle>Settle Payment - Order #{orderToSettle?.orderNumber || '-'}</DialogTitle>
          </DialogHeader>

          {orderToSettle && (
            <div className="space-y-4">
              {/* Amount Summary */}
              <div className="bg-warning/10 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="text-lg font-bold text-warning">₹{orderToSettle.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Paid</div>
                    <div className="text-lg font-bold text-primary">₹{orderToSettle.amountPaid || 0}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Due</div>
                    <div className="text-lg font-bold text-warning">₹{orderToSettle.amountDue ?? orderToSettle.total}</div>
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
                        const amountDue = orderToSettle.amountDue ?? orderToSettle.total;
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
                  max={orderToSettle.amountDue ?? orderToSettle.total}
                />
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Customer</div>
                  <div className="font-medium">{orderToSettle.customerName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Table</div>
                  <div className="font-medium">{orderToSettle.tableId ? parseInt(orderToSettle.tableId.slice(-2)) || '-' : '-'}</div>
                </div>
              </div>

              {/* Previous Payments */}
              {orderToSettle.partialPayments && orderToSettle.partialPayments.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-2">Previous Payments</div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {orderToSettle.partialPayments.map((payment, idx) => (
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
    </div>
  );
}

