"use client";

import { PageLoading } from '@/components/PageLoading';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders, useUpdateOrder } from '@/hooks/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, Volume2, VolumeX, CheckCircle2, Utensils, ArrowRight } from 'lucide-react';
import type { Order, OrderItem } from '@/types/restaurant';
import { toast } from 'sonner';

type OrderStatus = 'active' | 'preparing' | 'ready' | 'served' | 'closed' | 'cancelled' | 'pending_payment';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; nextStatus: OrderStatus | null }> = {
  active: { label: 'New', color: 'text-info', bgColor: 'bg-info/10 border-info/20', nextStatus: 'preparing' },
  preparing: { label: 'Preparing', color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20', nextStatus: 'ready' },
  ready: { label: 'Ready', color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20', nextStatus: 'served' },
  served: { label: 'Served', color: 'text-muted-foreground', bgColor: 'bg-muted border-border', nextStatus: null },
  closed: { label: 'Closed', color: 'text-muted-foreground', bgColor: 'bg-muted border-border', nextStatus: null },
  cancelled: { label: 'Cancelled', color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20', nextStatus: null },
  pending_payment: { label: 'Pending Payment', color: 'text-warning', bgColor: 'bg-warning/10 border-warning/20', nextStatus: null },
};

const itemStatusConfig = {
  pending: { label: 'Pending', color: 'text-info', bgColor: 'bg-info/10', icon: Clock },
  preparing: { label: 'Preparing', color: 'text-warning', bgColor: 'bg-warning/10', icon: Utensils },
  ready: { label: 'Ready', color: 'text-primary', bgColor: 'bg-primary/10', icon: CheckCircle2 },
  served: { label: 'Served', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: CheckCircle2 },
};

export default function KDS() {
  const navigate = useNavigate();
  const { restaurant } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const lastOrderCountRef = useRef(0);

  const { data: ordersData } = useOrders(restaurant?.id, { status: 'active', limit: 500 });
  const updateOrder = useUpdateOrder(restaurant?.id);

  // Get kitchen orders filtered
  const orders = (ordersData?.orders || []).filter(o => {
    const hasUnservedItems = o.items.some(i => !i.status || i.status !== 'served');
    const isActiveOrder = ['active', 'preparing', 'ready'].includes(o.status);
    return isActiveOrder && hasUnservedItems;
  }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Sound notification for new orders
  useEffect(() => {
    if (soundEnabled && orders.length > lastOrderCountRef.current && lastOrderCountRef.current > 0) {
      playNotificationSound();
    }
    lastOrderCountRef.current = orders.length;
  }, [orders.length, soundEnabled]);

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  };

  const handleItemStatusChange = (orderId: string, item: OrderItem) => {
    if (!restaurant) return;
    
    const currentStatus = item.status || 'pending';
    const nextStatusMap: { [key: string]: 'preparing' | 'ready' | 'served' | null } = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: null,
    };
    const nextStatus = nextStatusMap[currentStatus];
    
    if (nextStatus) {
      // Find the order and update item status via API
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      const updatedItems = order.items.map(i =>
        i.id === item.id ? { ...i, status: nextStatus } : i
      );

      updateOrder.mutate({
        orderId,
        items: updatedItems as unknown as Record<string, unknown>[],
      });
      
      if (nextStatus === 'served') {
        toast.success(`${item.name} served`);
      } else if (nextStatus === 'ready') {
        toast.success(`${item.name} ready for pickup`);
      }
    }
  };

  const handleStatusChange = (orderId: string, currentStatus: OrderStatus) => {
    if (!restaurant) return;
    const nextStatus = statusConfig[currentStatus].nextStatus;
    if (nextStatus) {
      updateOrder.mutate({ orderId, status: nextStatus });

      if (nextStatus === 'ready') {
        toast.success('Order marked as ready for pickup!');
      } else if (nextStatus === 'served') {
        toast.success('Order served');
      }
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getTimeColor = (createdAt: string) => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    const minutes = Math.floor(elapsed / 60000);

    if (minutes > 30) return 'text-destructive';
    if (minutes > 15) return 'text-warning';
    return 'text-muted-foreground';
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const ordersByStatus = {
    active: orders.filter(o => o.status === 'active'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready'),
  };

  // Count unserved items per order
  const getUnservedItemCount = (order: Order) => {
    return order.items.filter(i => !i.status || i.status !== 'served').length;
  };

  // Get unserved items for display
  const getUnservedItems = (order: Order) => {
    return order.items.filter(i => !i.status || i.status !== 'served');
  };

  if (!restaurant) {
    return <PageLoading message="Loading kitchen display..." />;
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-3 rounded-xl">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Kitchen Display System</h1>
              <p className="text-muted-foreground text-sm">Click items to update status</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
              title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>

            <div className="flex gap-2">
              {(['all', 'active', 'preparing', 'ready'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? 'bg-foreground text-background'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {status === 'all' ? 'All' : statusConfig[status].label}
                  {status !== 'all' && (
                    <span className="ml-2 bg-muted text-foreground px-2 py-0.5 rounded-full text-xs">
                      {ordersByStatus[status]?.length || 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="text-info text-sm font-medium">New Orders</div>
            <div className="text-3xl font-bold text-info">{ordersByStatus.active.length}</div>
          </Card>
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="text-warning text-sm font-medium">Preparing</div>
            <div className="text-3xl font-bold text-warning">{ordersByStatus.preparing.length}</div>
          </Card>
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="text-primary text-sm font-medium">Ready</div>
            <div className="text-3xl font-bold text-primary">{ordersByStatus.ready.length}</div>
          </Card>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const elapsed = getElapsedTime(order.createdAt);
              const timeColor = getTimeColor(order.createdAt);
              const unservedItems = getUnservedItems(order);
              const unservedCount = getUnservedItemCount(order);

              return (
                <Card
                  key={order.id}
                  className={`${config.bgColor} border-2 p-4 transition-all hover:shadow-lg`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold text-foreground">#{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">Table {order.tableId.slice(-2)}</div>
                    </div>
                    <div className={`flex items-center gap-1 ${timeColor} bg-background/50 px-2 py-1 rounded-lg`}>
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{elapsed}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color} bg-background/70 mb-3`}>
                    {config.label}
                    {unservedCount < order.items.length && (
                      <span className="text-xs ml-1">({unservedCount}/{order.items.length})</span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <div className="font-medium text-foreground">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.adults} Adults {order.kids > 0 && `- ${order.kids} Kids`}
                    </div>
                  </div>

                  {/* Items - Clickable */}
                  <div className="space-y-2 mb-4">
                    {unservedItems.map((item, idx) => {
                      const itemStatus = item.status || 'pending';
                      const itemConfig = itemStatusConfig[itemStatus];
                      const Icon = itemConfig.icon;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleItemStatusChange(order.id, item)}
                          className={`w-full flex items-start justify-between bg-background/70 p-3 rounded-lg hover:bg-background transition-all text-left group ${
                            itemStatus === 'ready' ? 'ring-2 ring-primary' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-1.5 rounded ${itemConfig.bgColor}`}>
                              <Icon className={`h-4 w-4 ${itemConfig.color}`} />
                            </div>
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                <span className="font-bold">{item.quantity}x</span>
                                {item.name}
                              </div>
                              {/* Modifiers */}
                              {item.modifiers && item.modifiers.length > 0 && (
                                <div className="text-xs text-primary mt-0.5">
                                  {item.modifiers.map((mod, midx) => (
                                    <span key={midx}>
                                      {mod.options.map(o => o.name).join(', ')}
                                      {midx < item.modifiers!.length - 1 ? ' | ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.specialRequest && (
                                <div className="text-xs text-destructive mt-0.5">{item.specialRequest}</div>
                              )}
                              <div className={`text-xs mt-1 ${itemConfig.color}`}>
                                {itemConfig.label} — Click to advance
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Button - Mark All Served */}
                  {unservedItems.length > 1 && (
                    <Button
                      onClick={() => handleStatusChange(order.id, order.status)}
                      className={`w-full ${
                        order.status === 'active' ? 'bg-info hover:bg-info/90' :
                        order.status === 'preparing' ? 'bg-warning hover:bg-warning/90' :
                        'bg-primary hover:bg-primary/90'
                      } text-white`}
                    >
                      {order.status === 'active' && 'Start All Items'}
                      {order.status === 'preparing' && 'Mark All Ready'}
                      {order.status === 'ready' && 'Serve All Items'}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Active Items</h3>
            <p className="text-muted-foreground mb-4">All items have been served or no active orders</p>
            <Button onClick={() => navigate('/orders')} className="bg-primary hover:bg-primary/90">
              Go to Orders
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

