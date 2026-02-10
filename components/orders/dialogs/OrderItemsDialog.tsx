"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order, Table } from '@/services/dataService';

interface OrderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  selectedTable: Table | null;
  formatOrderTime: (time: string) => string;
  onClose: () => void;
  onEdit: () => void;
}

export function OrderItemsDialog({
  open,
  onOpenChange,
  order,
  selectedTable,
  formatOrderTime,
  onClose,
  onEdit,
}: OrderItemsDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {selectedTable?.tableNumber} - Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Customer</div>
            <div className="font-medium">{order.customerName}</div>
            <div className="text-xs text-muted-foreground">{order.customerMobile}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Order Time: {formatOrderTime(order.createdAt)}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Ordered Items:</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start p-2 bg-muted rounded">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Ordered: {formatOrderTime(item.addedAt || order.createdAt)}
                    </div>
                    {item.specialRequest && (
                      <div className="text-xs text-muted-foreground">{item.specialRequest}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground text-right">
                    {item.quantity} x ₹{item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹ {order.subTotal}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>₹ {order.tax}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>₹ {order.total}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              CLOSE
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onEdit}>
              EDIT ORDER
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

