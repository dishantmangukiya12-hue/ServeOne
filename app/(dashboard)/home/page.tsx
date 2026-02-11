"use client";

import { PageLoading } from '@/components/PageLoading';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ArrowRight,
  Utensils,
  Receipt,
  Clock,
  QrCode,
  BarChart3
} from 'lucide-react';
import type { Order } from '@/types/restaurant';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, useTables, useExpenses } from '@/hooks/api';

export default function Home() {
  const navigate = useNavigate();
  const { restaurant } = useAuth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const { data: ordersData } = useOrders(restaurant?.id, { date: todayStr, limit: 10000 });
  const { data: tablesData } = useTables(restaurant?.id);
  const { data: expensesData } = useExpenses(restaurant?.id, { date: todayStr });

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  const { todayStats, recentOrders } = useMemo(() => {
    const orders = ordersData?.orders || [];
    const expenses = expensesData?.expenses || [];

    const todayOrders = orders.filter(o =>
      isToday(o.createdAt) && o.status === 'active'
    );
    const todayClosed = orders.filter(o =>
      (o.closedAt && isToday(o.closedAt)) && o.status === 'closed'
    );
    const todayExpenses = expenses.filter(e => e.date === todayStr);

    return {
      todayStats: {
        sales: todayClosed.reduce((sum, o) => sum + (o.amountPaid || o.total), 0),
        orders: todayOrders.length + todayClosed.length,
        expenses: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
        customers: todayOrders.reduce((sum, o) => sum + o.adults + o.kids, 0) +
                   todayClosed.reduce((sum, o) => sum + o.adults + o.kids, 0)
      },
      recentOrders: orders
        .filter(o => o.status === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
  }, [ordersData?.orders, expensesData?.expenses, todayStr]);

  const tables = tablesData?.tables || [];
  const profit = todayStats.sales - todayStats.expenses;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;

  if (!restaurant) return <PageLoading message="Loading dashboard..." />;

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome + Date */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good Day!</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/orders')}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-l-2 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Today's Sales</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">₹{todayStats.sales.toLocaleString()}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-2 border-destructive">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Today's Expenses</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">₹{todayStats.expenses.toLocaleString()}</p>
              </div>
              <div className="bg-destructive/10 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-2 border-info">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                <p className={`text-xl md:text-2xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  ₹{profit.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-primary/10' : 'bg-destructive/10'}`}>
                <Receipt className={`h-5 w-5 ${profit >= 0 ? 'text-primary' : 'text-destructive'}`} />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-2 border-warning">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tables</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">
                  {occupiedCount}<span className="text-muted-foreground text-lg">/{tables.length}</span>
                </p>
              </div>
              <div className="bg-warning/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Quick Actions */}
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground">Quick Actions</h2>

            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-card p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary transition-colors">
                  <Utensils className="h-4 w-4 text-primary group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Take Order</p>
                  <p className="text-xs text-muted-foreground">New dine-in order</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>

            <button
              onClick={() => navigate('/qr')}
              className="w-full bg-card p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary transition-colors">
                  <QrCode className="h-4 w-4 text-primary group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">QR Orders</p>
                  <p className="text-xs text-muted-foreground">Customer scan orders</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>

            <button
              onClick={() => navigate('/expenses')}
              className="w-full bg-card p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary transition-colors">
                  <Receipt className="h-4 w-4 text-primary group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">Add Expense</p>
                  <p className="text-xs text-muted-foreground">Record spending</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>

            <button
              onClick={() => navigate('/reports')}
              className="w-full bg-card p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary transition-colors">
                  <BarChart3 className="h-4 w-4 text-primary group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">View Reports</p>
                  <p className="text-xs text-muted-foreground">Sales & analytics</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
            </button>
          </div>

          {/* Middle: Table Status */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Table Status</h2>
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-primary hover:text-primary/80"
              >
                View All
              </button>
            </div>
            <Card className="p-4">
              <div className="grid grid-cols-4 gap-2">
                {tables.map((table) => {
                  const isOccupied = table.status === 'occupied';
                  return (
                    <button
                      key={table.id}
                      onClick={() => navigate('/orders')}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all ${
                        isOccupied
                          ? 'bg-warning/10 border-2 border-warning/30 text-warning'
                          : 'bg-primary/5 border-2 border-primary/20 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <span className="text-lg font-bold">{table.tableNumber}</span>
                      <span className="text-[10px]">{isOccupied ? 'Busy' : 'Free'}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Active Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">Active Orders</h2>
              <span className="text-sm text-muted-foreground">{recentOrders.length} running</span>
            </div>
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Card key={order.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Table {order.tableId?.split('_').pop()}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{order.total}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground">
                  <Utensils className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active orders</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
