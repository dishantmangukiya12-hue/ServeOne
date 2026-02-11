"use client";

import { PageLoading } from '@/components/PageLoading';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { useOrders, useInventory } from '@/hooks/api';

import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { TrendingUp, ChevronDown, Calendar, DollarSign, ShoppingBag, Users, Package, Clock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

import type { Order } from '@/types/restaurant';

import {

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  ResponsiveContainer,

  BarChart,

  Bar,

  PieChart,

  Pie,

  Cell,

} from 'recharts';



interface Stats {

  totalOrders: number;

  todayRevenue: number;

  activeOrders: number;

  avgOrderValue: number;

  channelStats: {

    dineIn: { orders: number; amount: number };

    takeAway: { orders: number; amount: number };

    homeDelivery: { orders: number; amount: number };

    swiggy: { orders: number; amount: number };

    zomato: { orders: number; amount: number };

    other: { orders: number; amount: number };

  };

  // Comparison with previous period

  comparison: {

    totalOrders: { prev: number; change: number };

    revenue: { prev: number; change: number };

    avgOrderValue: { prev: number; change: number };

  };

}



const COLORS = ['#10b981', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];



export default function Dashboard() {

  const router = useRouter();

  const { restaurant } = useAuth();

  const [salesView, setSalesView] = useState<'revenue' | 'orders'>('revenue');

  const [dateRange, setDateRange] = useState('Today');

  const [showDateDropdown, setShowDateDropdown] = useState(false);



  const dateOptions = ['Today', 'Yesterday', 'This Week', 'This Month', 'Last Month'];

  // Compute current and previous period date ranges
  const { currentDates, prevDates } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let prevStart: Date;
    let prevEnd: Date;

    switch (dateRange) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        prevEnd = new Date(prevStart);
        prevEnd.setDate(prevEnd.getDate() + 1);
        break;
      case 'Yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        prevEnd = new Date(prevStart);
        prevEnd.setDate(prevEnd.getDate() + 1);
        break;
      case 'This Week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        prevStart = new Date(startDate);
        prevStart.setDate(prevStart.getDate() - 7);
        prevEnd = new Date(startDate);
        break;
      case 'This Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'Last Month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        prevEnd = new Date(prevStart);
        prevEnd.setDate(prevEnd.getDate() + 1);
    }

    return {
      currentDates: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      prevDates: { startDate: prevStart.toISOString(), endDate: prevEnd.toISOString() },
    };
  }, [dateRange]);

  // Fetch current period orders
  const { data: ordersData } = useOrders(restaurant?.id, {
    startDate: currentDates.startDate,
    endDate: currentDates.endDate,
    limit: 500,
  });

  // Fetch previous period orders for comparison
  const { data: prevOrdersData } = useOrders(restaurant?.id, {
    startDate: prevDates.startDate,
    endDate: prevDates.endDate,
    status: 'closed',
    limit: 500,
  });

  // Fetch inventory for alerts
  const { data: inventoryData } = useInventory(restaurant?.id);
  const { data: restaurantData } = useOrders(restaurant?.id, { limit: 0 }); // Just for restaurant context

  const orders = useMemo(() => ordersData?.orders || [], [ordersData]);

  // Compute inventory alerts
  const inventoryAlerts = useMemo(() => {
    const items = inventoryData?.items || [];
    return items.filter((item: { quantity: number; minThreshold?: number }) =>
      item.quantity <= (item.minThreshold || 10)
    ).length;
  }, [inventoryData]);

  // Compute all stats from orders
  const stats = useMemo(() => {
    const closedOrders = orders.filter(o => o.status === 'closed');
    const activeOrders = orders.filter(o =>
      o.status === 'active' || o.status === 'preparing' || o.status === 'ready'
    );

    const todayRevenue = closedOrders.reduce((sum, o) => sum + (o.amountPaid || o.total), 0);

    const channelStats: Stats['channelStats'] = {
      dineIn: { orders: 0, amount: 0 },
      takeAway: { orders: 0, amount: 0 },
      homeDelivery: { orders: 0, amount: 0 },
      swiggy: { orders: 0, amount: 0 },
      zomato: { orders: 0, amount: 0 },
      other: { orders: 0, amount: 0 },
    };

    closedOrders.forEach(order => {
      const channel = (order.channel || 'dineIn') as keyof typeof channelStats;
      if (channelStats[channel]) {
        channelStats[channel].orders++;
        channelStats[channel].amount += order.amountPaid || order.total;
      }
    });

    // Previous period comparison
    const prevPeriodOrders = prevOrdersData?.orders || [];
    const prevRevenue = prevPeriodOrders.reduce((sum: number, o: Order) => sum + (o.amountPaid || o.total), 0);
    const prevOrderCount = prevPeriodOrders.length;
    const prevAvgOrder = prevOrderCount > 0 ? Math.round(prevRevenue / prevOrderCount) : 0;

    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    const currentAvgOrder = closedOrders.length > 0 ? Math.round(todayRevenue / closedOrders.length) : 0;

    return {
      totalOrders: closedOrders.length,
      todayRevenue,
      activeOrders: activeOrders.length,
      avgOrderValue: currentAvgOrder,
      channelStats,
      comparison: {
        totalOrders: { prev: prevOrderCount, change: calcChange(closedOrders.length, prevOrderCount) },
        revenue: { prev: prevRevenue, change: calcChange(todayRevenue, prevRevenue) },
        avgOrderValue: { prev: prevAvgOrder, change: calcChange(currentAvgOrder, prevAvgOrder) },
      }
    };
  }, [orders, prevOrdersData]);



  // Hourly data for charts

  const hourlyData = Array.from({ length: 14 }, (_, i) => {

    const hour = i + 8; // 8 AM to 10 PM

    const hourOrders = orders.filter(o => {

      const date = new Date(o.createdAt);

      return date.getHours() === hour;

    });

    const revenue = hourOrders.reduce((sum, o) => sum + (o.amountPaid || o.total), 0);

    return {

      time: `${hour}:00`,

      revenue,

      orders: hourOrders.length

    };

  });



  // Channel chart data

  const channelChartData = [

    { name: 'Dine In', value: stats.channelStats.dineIn.amount, orders: stats.channelStats.dineIn.orders },

    { name: 'Take Away', value: stats.channelStats.takeAway.amount, orders: stats.channelStats.takeAway.orders },

    { name: 'Delivery', value: stats.channelStats.homeDelivery.amount, orders: stats.channelStats.homeDelivery.orders },

    { name: 'Swiggy', value: stats.channelStats.swiggy.amount, orders: stats.channelStats.swiggy.orders },

    { name: 'Zomato', value: stats.channelStats.zomato.amount, orders: stats.channelStats.zomato.orders },

  ].filter(c => c.value > 0);



  // Payment method breakdown

  const paymentData: { [key: string]: number } = {};

  orders.filter(o => o.status === 'closed').forEach(order => {

    const method = order.paymentMethod || 'Cash';

    const amount = order.amountPaid || order.total;

    paymentData[method] = (paymentData[method] || 0) + amount;

  });



  const paymentChartData = Object.entries(paymentData).map(([name, value]) => ({ name, value }));



  // Top selling items

  const itemSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};

  orders.filter(o => o.status === 'closed').forEach(order => {

    order.items.forEach(item => {

      if (!itemSales[item.name]) {

        itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };

      }

      itemSales[item.name].quantity += item.quantity;

      itemSales[item.name].revenue += item.price * item.quantity;

    });

  });



  const topItems = Object.values(itemSales)

    .sort((a, b) => b.revenue - a.revenue)

    .slice(0, 5);



  // Order status counts

  const statusCounts = {

    active: orders.filter(o => o.status === 'active').length,

    preparing: orders.filter(o => o.status === 'preparing').length,

    ready: orders.filter(o => o.status === 'ready').length,

    closed: orders.filter(o => o.status === 'closed').length,

  };



  if (!restaurant) {
    return <PageLoading message="Loading dashboard..." />;
  }



  return (

    <div className="min-h-screen bg-background">

      <main className="p-4 md:p-6 max-w-7xl mx-auto">

        {/* Header */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-3">

          <div>

            <h1 className="text-xl md:text-2xl font-bold text-foreground">

              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}

            </h1>

            <p className="text-muted-foreground mt-1 text-sm md:text-base">Here&apos;s your business overview</p>

          </div>

          <div className="flex gap-2">

            {inventoryAlerts > 0 && (

              <button

                onClick={() => router.push('/inventory')}

                className="flex items-center gap-2 bg-destructive/10 px-3 md:px-4 py-2 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/15 transition-colors text-sm"

              >

                <Package className="h-4 w-4" />

                {inventoryAlerts} Low Stock

              </button>

            )}

            <div className="relative">

              <button

                onClick={() => setShowDateDropdown(!showDateDropdown)}

                className="flex items-center gap-2 bg-card px-3 md:px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm md:text-base w-full sm:w-auto justify-between sm:justify-start"

              >

                <Calendar className="h-4 w-4 text-muted-foreground" />

                {dateRange}

                <ChevronDown className="h-4 w-4 text-muted-foreground" />

              </button>

              {showDateDropdown && (

                <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10 min-w-40 overflow-hidden">

                  {dateOptions.map((option) => (

                    <button

                      key={option}

                      onClick={() => {

                        setDateRange(option);

                        setShowDateDropdown(false);

                      }}

                      className="block w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground transition-colors"

                    >

                      {option}

                    </button>

                  ))}

                </div>

              )}

            </div>

          </div>

        </div>



        {/* Quick Actions */}

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">

          <button

            onClick={() => router.push('/orders')}

            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"

          >

            <ShoppingBag className="h-4 w-4" />

            New Order

          </button>

          <button

            onClick={() => router.push('/kds')}

            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"

          >

            <Clock className="h-4 w-4" />

            Kitchen Display

          </button>

          <button

            onClick={() => router.push('/reservations')}

            className="flex items-center gap-2 bg-warning text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-warning/90 transition-colors whitespace-nowrap"

          >

            <Calendar className="h-4 w-4" />

            Reservations

          </button>

          <button

            onClick={() => router.push('/inventory')}

            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"

          >

            <Package className="h-4 w-4" />

            Inventory

          </button>

        </div>



        {/* Stats Cards */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">

          <Card className="p-3 md:p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/orders')}>

            <div className="flex items-start justify-between">

              <div>

                <p className="text-muted-foreground text-xs md:text-sm">Total Orders</p>

                <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{stats.totalOrders}</p>

                {/* Comparison indicator */}

                {stats.comparison.totalOrders.prev > 0 && (

                  <div className={`flex items-center gap-0.5 mt-1 text-[10px] md:text-xs ${

                    stats.comparison.totalOrders.change > 0 ? 'text-primary' :

                    stats.comparison.totalOrders.change < 0 ? 'text-destructive' : 'text-muted-foreground'

                  }`}>

                    {stats.comparison.totalOrders.change > 0 ? (

                      <ArrowUpRight className="h-3 w-3" />

                    ) : stats.comparison.totalOrders.change < 0 ? (

                      <ArrowDownRight className="h-3 w-3" />

                    ) : (

                      <Minus className="h-3 w-3" />

                    )}

                    <span>{Math.abs(stats.comparison.totalOrders.change)}% vs prev</span>

                  </div>

                )}

              </div>

              <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg md:rounded-xl">

                <ShoppingBag className="h-4 w-4 md:h-5 md:w-5 text-primary" />

              </div>

            </div>

          </Card>

          <Card className="p-3 md:p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-muted-foreground text-xs md:text-sm">Revenue</p>

                <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{"\u20B9"}{stats.todayRevenue.toLocaleString()}</p>

                {/* Comparison indicator */}

                {stats.comparison.revenue.prev > 0 && (

                  <div className={`flex items-center gap-0.5 mt-1 text-[10px] md:text-xs ${

                    stats.comparison.revenue.change > 0 ? 'text-primary' :

                    stats.comparison.revenue.change < 0 ? 'text-destructive' : 'text-muted-foreground'

                  }`}>

                    {stats.comparison.revenue.change > 0 ? (

                      <ArrowUpRight className="h-3 w-3" />

                    ) : stats.comparison.revenue.change < 0 ? (

                      <ArrowDownRight className="h-3 w-3" />

                    ) : (

                      <Minus className="h-3 w-3" />

                    )}

                    <span>{Math.abs(stats.comparison.revenue.change)}% vs prev</span>

                  </div>

                )}

              </div>

              <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg md:rounded-xl">

                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />

              </div>

            </div>

          </Card>

          <Card className="p-3 md:p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/kds')}>

            <div className="flex items-start justify-between">

              <div>

                <p className="text-muted-foreground text-xs md:text-sm">Active Orders</p>

                <p className="text-xl md:text-2xl font-bold text-foreground mt-1">{stats.activeOrders}</p>

              </div>

              <div className="bg-warning/10 p-2 md:p-2.5 rounded-lg md:rounded-xl">

                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-warning" />

              </div>

            </div>

          </Card>

          <Card className="p-3 md:p-5 bg-card border-border shadow-sm hover:shadow-md transition-shadow">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-muted-foreground text-xs md:text-sm">Avg Order</p>

                <p className="text-xl md:text-2xl font-bold text-foreground mt-1">

                  {"\u20B9"}{stats.avgOrderValue}

                </p>

                {/* Comparison indicator */}

                {stats.comparison.avgOrderValue.prev > 0 && (

                  <div className={`flex items-center gap-0.5 mt-1 text-[10px] md:text-xs ${

                    stats.comparison.avgOrderValue.change > 0 ? 'text-primary' :

                    stats.comparison.avgOrderValue.change < 0 ? 'text-destructive' : 'text-muted-foreground'

                  }`}>

                    {stats.comparison.avgOrderValue.change > 0 ? (

                      <ArrowUpRight className="h-3 w-3" />

                    ) : stats.comparison.avgOrderValue.change < 0 ? (

                      <ArrowDownRight className="h-3 w-3" />

                    ) : (

                      <Minus className="h-3 w-3" />

                    )}

                    <span>{Math.abs(stats.comparison.avgOrderValue.change)}% vs prev</span>

                  </div>

                )}

              </div>

              <div className="bg-destructive/10 p-2 md:p-2.5 rounded-lg md:rounded-xl">

                <Users className="h-4 w-4 md:h-5 md:w-5 text-destructive" />

              </div>

            </div>

          </Card>

        </div>



        {/* Order Status Overview */}

        {(statusCounts.active > 0 || statusCounts.preparing > 0 || statusCounts.ready > 0) && (

          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">

            {statusCounts.active > 0 && (

              <div className="bg-info/10 border border-info/20 rounded-xl p-3 md:p-4">

                <div className="text-info text-xs md:text-sm font-medium">Active</div>

                <div className="text-xl md:text-2xl font-bold text-info">{statusCounts.active}</div>

              </div>

            )}

            {statusCounts.preparing > 0 && (

              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 md:p-4">

                <div className="text-warning text-xs md:text-sm font-medium">Preparing</div>

                <div className="text-xl md:text-2xl font-bold text-warning">{statusCounts.preparing}</div>

              </div>

            )}

            {statusCounts.ready > 0 && (

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 md:p-4">

                <div className="text-primary text-xs md:text-sm font-medium">Ready</div>

                <div className="text-xl md:text-2xl font-bold text-primary">{statusCounts.ready}</div>

              </div>

            )}

          </div>

        )}



        {/* Sales Chart */}

        <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-card border-border shadow-sm">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">

            <h3 className="font-semibold text-foreground text-sm md:text-base">Sales Overview</h3>

            <div className="flex rounded-lg overflow-hidden border border-border w-fit">

              <Button

                variant={salesView === 'revenue' ? 'default' : 'ghost'}

                onClick={() => setSalesView('revenue')}

                className={`rounded-none px-3 md:px-4 text-xs md:text-sm ${salesView === 'revenue' ? 'bg-primary hover:bg-primary/90' : 'text-muted-foreground'}`}

              >

                Revenue

              </Button>

              <Button

                variant={salesView === 'orders' ? 'default' : 'ghost'}

                onClick={() => setSalesView('orders')}

                className={`rounded-none px-3 md:px-4 text-xs md:text-sm ${salesView === 'orders' ? 'bg-primary hover:bg-primary/90' : 'text-muted-foreground'}`}

              >

                Orders

              </Button>

            </div>

          </div>



          <div className="h-64">

            {orders.length > 0 ? (

              <ResponsiveContainer width="100%" height="100%">

                <LineChart data={hourlyData}>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />

                  <YAxis stroke="#64748b" fontSize={12} />

                  <Tooltip

                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}

                  />

                  <Line

                    type="monotone"

                    dataKey={salesView === 'revenue' ? 'revenue' : 'orders'}

                    stroke="#10b981"

                    strokeWidth={3}

                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}

                    activeDot={{ r: 6, fill: '#10b981' }}

                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className="h-full flex items-center justify-center text-muted-foreground">

                <div className="text-center">

                  <div className="text-5xl mb-3">{"\uD83D\uDCCA"}</div>

                  <p>No sales data for {dateRange.toLowerCase()}</p>

                  <button

                    onClick={() => router.push('/orders')}

                    className="text-primary text-sm mt-2 hover:underline"

                  >

                    Create your first order →

                  </button>

                </div>

              </div>

            )}

          </div>

        </Card>



        {/* Channels and Top Items */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">

          {/* Sales by Channel - FIXED */}

          <Card className="p-4 md:p-6 bg-card border-border shadow-sm">

            <h3 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Sales by Channel</h3>

            <div className="h-48">

              {channelChartData.length > 0 ? (

                <ResponsiveContainer width="100%" height="100%">

                  <PieChart>

                    <Pie

                      data={channelChartData}

                      cx="50%"

                      cy="50%"

                      innerRadius={40}

                      outerRadius={70}

                      paddingAngle={5}

                      dataKey="value"

                    >

                      {channelChartData.map((_entry, index) => (

                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                      ))}

                    </Pie>

                    <Tooltip />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <div className="h-full flex items-center justify-center text-muted-foreground">

                  <p className="text-sm">No channel data available</p>

                </div>

              )}

            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">

              {Object.entries(stats.channelStats)

                .filter(([_, stat]) => stat.orders > 0)

                .map(([channel, stat]) => (

                  <div key={channel} className="flex items-center justify-between text-xs md:text-sm">

                    <span className="capitalize text-muted-foreground">{channel.replace(/([A-Z])/g, ' $1').trim()}</span>

                    <span className="font-medium">{"\u20B9"}{stat.amount.toLocaleString()}</span>

                  </div>

                ))}

            </div>

          </Card>



          {/* Top Selling Items */}

          <Card className="p-4 md:p-6 bg-card border-border shadow-sm">

            <h3 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Top Selling Items</h3>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[250px] text-xs md:text-sm">

                <thead>

                  <tr className="text-muted-foreground border-b border-border">

                    <th className="text-left py-2 md:py-3 font-medium">Item</th>

                    <th className="text-left font-medium">Qty</th>

                    <th className="text-left font-medium">Revenue</th>

                  </tr>

                </thead>

                <tbody>

                  {topItems.length > 0 ? (

                    topItems.map((item) => (

                      <tr key={item.name} className="border-b border-border/50 last:border-0">

                        <td className="py-2 md:py-3 text-foreground truncate max-w-[120px] md:max-w-none">{item.name}</td>

                        <td className="text-muted-foreground">{item.quantity}</td>

                        <td className="font-medium text-foreground">{"\u20B9"}{item.revenue.toLocaleString()}</td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td className="py-4 text-muted-foreground text-center" colSpan={3}>

                        No sales data available

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </Card>

        </div>



        {/* Payment Methods */}

        {paymentChartData.length > 0 && (

          <Card className="p-4 md:p-6 mb-4 md:mb-6 bg-card border-border shadow-sm">

            <h3 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Payment Methods</h3>

            <div className="h-40">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={paymentChartData}>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />

                  <YAxis stroke="#64748b" fontSize={12} />

                  <Tooltip

                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}

                    formatter={(value: number) => `\u20B9${value.toLocaleString()}`}

                  />

                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </Card>

        )}



        {/* Recent Orders */}

        <Card className="p-4 md:p-6 bg-card border-border shadow-sm">

          <div className="flex items-center justify-between mb-3 md:mb-4">

            <h3 className="font-semibold text-foreground text-sm md:text-base">Recent Orders</h3>

            <button

              onClick={() => router.push('/reports')}

              className="text-primary text-xs md:text-sm hover:underline"

            >

              View All →

            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[400px] text-xs md:text-sm">

              <thead>

                <tr className="text-muted-foreground border-b border-border">

                  <th className="text-left py-2 md:py-3 font-medium">Order #</th>

                  <th className="text-left font-medium">Table</th>

                  <th className="text-left font-medium">Items</th>

                  <th className="text-left font-medium">Amount</th>

                  <th className="text-left font-medium">Status</th>

                </tr>

              </thead>

              <tbody>

                {orders.filter(o => o.status !== 'cancelled').slice(0, 5).length > 0 ? (

                  orders.filter(o => o.status !== 'cancelled').slice(0, 5).map((order) => (

                    <tr key={order.id} className="border-b border-border/50 last:border-0">

                      <td className="py-2 md:py-3 text-foreground">#{order.orderNumber || '-'}</td>

                      <td className="text-muted-foreground">{order.tableId.slice(-2)}</td>

                      <td className="text-muted-foreground">{order.items.length} items</td>

                      <td className="font-medium text-foreground">{"\u20B9"}{order.total.toLocaleString()}</td>

                      <td>

                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${

                          order.status === 'active'

                            ? 'bg-info/10 text-info'

                            : order.status === 'preparing'

                            ? 'bg-warning/10 text-warning'

                            : order.status === 'ready'

                            ? 'bg-primary/10 text-primary'

                            : order.status === 'closed'

                            ? 'bg-muted text-muted-foreground'

                            : 'bg-destructive/10 text-destructive'

                        }`}>

                          {order.status}

                        </span>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td className="py-4 text-muted-foreground text-center" colSpan={5}>

                      No orders yet. Create orders from the Orders page.

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </Card>

      </main>

    </div>

  );

}



