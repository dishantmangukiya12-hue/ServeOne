"use client";

import { useState, useEffect } from 'react';
import { Plus, Clock, ChefHat, Bell, CheckCircle } from 'lucide-react';
import type { Table, Order } from '@/types/restaurant';

interface TableCardProps {
  table: Table;
  order: Order | null;
  onTableClick: (table: Table) => void;
  onMenuClick: (e: React.MouseEvent, table: Table) => void;
  formatOrderTime: (createdAt: string) => string;
}

function useElapsedTime(createdAt: string | undefined) {
  const [elapsed, setElapsed] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'urgent'>('normal');

  useEffect(() => {
    if (!createdAt) return;

    const updateElapsed = () => {
      const diff = Date.now() - new Date(createdAt).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      if (hours > 0) {
        setElapsed(`${hours}h ${mins}m`);
      } else {
        setElapsed(`${mins}m`);
      }

      // Set urgency based on time
      if (minutes >= 90) {
        setUrgency('urgent');
      } else if (minutes >= 60) {
        setUrgency('warning');
      } else {
        setUrgency('normal');
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [createdAt]);

  return { elapsed, urgency };
}

export function TableCard({
  table,
  order,
  onTableClick,
  onMenuClick,
  formatOrderTime,
}: TableCardProps) {
  const { elapsed, urgency } = useElapsedTime(order?.createdAt);
  return (
    <div
      onClick={() => onTableClick(table)}
      className={`relative cursor-pointer rounded-xl md:rounded-2xl p-3 md:p-4 transition-all duration-200 hover:shadow-lg ${
        table.status === 'occupied'
          ? 'bg-warning/10 border-2 border-warning/20'
          : 'bg-card border-2 border-primary/20 hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="font-bold text-lg md:text-xl text-foreground">{table.tableNumber}</span>
        {table.status === 'available' && (
          <div className="w-6 h-6 md:w-7 md:h-7 bg-primary rounded-full flex items-center justify-center shadow-sm">
            <Plus className="h-3 w-3 md:h-4 md:w-4 text-white" />
          </div>
        )}
        {table.status === 'occupied' && (
          <button
            onClick={(e) => onMenuClick(e, table)}
            className="text-warning hover:bg-warning/10 p-1 rounded-md md:rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
        )}
      </div>
      {table.status === 'occupied' && order && (
        <div className="space-y-1 md:space-y-1.5">
          {/* Order Status Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Timer Badge */}
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
              urgency === 'urgent'
                ? 'bg-destructive/10 text-destructive'
                : urgency === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-primary/10 text-primary'
            }`}>
              <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
              {elapsed}
            </div>
            {/* Status Badge */}
            {order.status === 'preparing' && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-info/10 text-info">
                <ChefHat className="h-2.5 w-2.5 md:h-3 md:w-3" />
                Preparing
              </div>
            )}
            {order.status === 'ready' && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-info/10 text-info animate-pulse">
                <Bell className="h-2.5 w-2.5 md:h-3 md:w-3" />
                Ready!
              </div>
            )}
            {order.status === 'served' && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-primary/10 text-primary">
                <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                Served
              </div>
            )}
            {order.status === 'pending_payment' && (
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-warning/10 text-warning">
                <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                Pay Later
              </div>
            )}
          </div>
          <div className="font-bold text-primary text-sm md:text-base">₹{order.total.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-muted-foreground">{order.adults + order.kids} guests</span>
            <span className="text-[9px] md:text-[10px] text-muted-foreground/70">
              {formatOrderTime(order.createdAt)}
            </span>
          </div>
        </div>
      )}
      {table.status === 'available' && (
        <div className="text-[10px] md:text-xs text-primary font-medium">Tap to order</div>
      )}
    </div>
  );
}

