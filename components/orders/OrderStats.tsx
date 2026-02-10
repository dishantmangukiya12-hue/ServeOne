"use client";

import { QrCode } from 'lucide-react';
import type { Table, Order } from '@/services/dataService';

interface OrderStatsProps {
  tables: Table[];
  getOrderForTable: (table: Table) => Order | null;
  pendingQRCount: number;
  onOpenQROrders: () => void;
}

export function OrderStats({
  tables,
  getOrderForTable,
  pendingQRCount,
  onOpenQROrders,
}: OrderStatsProps) {
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const totalSales = tables
    .filter(t => t.status === 'occupied')
    .reduce((sum, t) => {
      const order = getOrderForTable(t);
      return sum + (order?.total || 0);
    }, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
      {/* Available Tables */}
      <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18" />
            </svg>
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm">Available</p>
            <p className="text-lg md:text-xl font-bold text-foreground">{availableCount}</p>
          </div>
        </div>
      </div>

      {/* Occupied Tables */}
      <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-warning/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm">Occupied</p>
            <p className="text-lg md:text-xl font-bold text-foreground">{occupiedCount}</p>
          </div>
        </div>
      </div>

      {/* Sales */}
      <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border border-border">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary/10 p-1.5 md:p-2 rounded-lg md:rounded-xl">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <p className="text-muted-foreground text-xs md:text-sm">Sales</p>
            <p className="text-sm md:text-xl font-bold text-foreground">₹{totalSales.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* QR Orders */}
      <button
        onClick={onOpenQROrders}
        className={`rounded-xl md:rounded-2xl p-3 md:p-4 shadow-sm border transition-colors text-left ${
          pendingQRCount > 0
            ? 'bg-primary border-primary text-white'
            : 'bg-card border-border'
        }`}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl ${
            pendingQRCount > 0 ? 'bg-white/20' : 'bg-primary/10'
          }`}>
            <QrCode className={`h-4 w-4 md:h-5 md:w-5 ${
              pendingQRCount > 0 ? 'text-white' : 'text-primary'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs md:text-sm ${pendingQRCount > 0 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              QR Orders
            </p>
            <p className="text-lg md:text-xl font-bold">
              {pendingQRCount > 0 ? `${pendingQRCount} Pending` : 'No Orders'}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

