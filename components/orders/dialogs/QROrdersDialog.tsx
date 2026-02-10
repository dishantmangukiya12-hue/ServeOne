"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { QrCode, Bell, User, ShoppingBag, Table as TableIcon } from 'lucide-react';

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

interface QROrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingOrders: QROrder[];
  onSelectOrder: (order: QROrder) => void;
  getElapsedTime: (timestamp: string) => string;
}

export function QROrdersDialog({
  open,
  onOpenChange,
  pendingOrders,
  onSelectOrder,
  getElapsedTime,
}: QROrdersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Orders
            {pendingOrders.length > 0 && (
              <span className="bg-warning/10 text-warning text-xs px-2 py-0.5 rounded-full">
                {pendingOrders.length} pending
              </span>
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
                  onClick={() => onSelectOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <TableIcon className="h-6 w-6 text-primary" />
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
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { QROrder };

